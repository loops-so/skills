#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
	existsSync,
	readdirSync,
	readFileSync,
	statSync,
} from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const rootArgumentIndex = process.argv.indexOf("--root");
if (rootArgumentIndex >= 0 && !process.argv[rootArgumentIndex + 1]) {
	throw new Error("Pass a repository path after --root.");
}
const root = resolve(
	rootArgumentIndex >= 0 ? process.argv[rootArgumentIndex + 1] : process.cwd(),
);

if (!existsSync(root)) {
	throw new Error(`Repository root does not exist: ${root}`);
}

const providerPackages = [
	{ provider: "Amazon SES", pattern: /^@aws-sdk\/client-sesv2?$/ },
	{ provider: "Mailgun", pattern: /^mailgun(?:\.js|-js)?$/ },
	{ provider: "MailerSend", pattern: /^mailersend$/ },
	{ provider: "Nodemailer or SMTP", pattern: /^nodemailer$/ },
	{ provider: "Postmark", pattern: /^postmark$/ },
	{ provider: "Resend", pattern: /^resend$/ },
	{ provider: "SendGrid", pattern: /^@sendgrid\// },
	{ provider: "SparkPost", pattern: /^sparkpost$/ },
];

const rendererPackages = [
	{ renderer: "MJML", pattern: /^mjml(?:-|$)/ },
	{ renderer: "React Email", pattern: /^@react-email\/|^react-email$/ },
];

const providerSourcePatterns = [
	{ provider: "Amazon SES", pattern: /(?:from\s+|require\(\s*|import\(\s*)["']@aws-sdk\/client-sesv?2?["']|new SESv?2?Client\b/gi },
	{ provider: "Mailgun", pattern: /(?:from\s+|require\(\s*|import\(\s*)["']mailgun(?:\.js|-js)?["']|\b(?:import|from)\s+mailgun\b|api\.mailgun\.net/gi },
	{ provider: "MailerSend", pattern: /(?:from\s+|require\(\s*|import\(\s*)["']mailersend["']|\b(?:import|from)\s+mailersend\b|api\.mailersend\.com/gi },
	{ provider: "Nodemailer or SMTP", pattern: /(?:from\s+|require\(\s*|import\(\s*)["']nodemailer["']|\b(?:import|from)\s+nodemailer\b|createTransport\s*\(|\bsmtp:\/\//gi },
	{ provider: "Postmark", pattern: /(?:from\s+|require\(\s*|import\(\s*)["']postmark["']|\b(?:import|from)\s+postmark\b|api\.postmarkapp\.com/gi },
	{ provider: "Resend", pattern: /(?:from\s+|require\(\s*|import\(\s*)["']resend["']|\bimport\s+resend\b|\bfrom\s+resend(?:\.|\s)|api\.resend\.com|new Resend\s*\(/gi },
	{ provider: "SendGrid", pattern: /(?:from\s+|require\(\s*|import\(\s*)["']@sendgrid\/[^"']+["']|\b(?:import|from)\s+sendgrid\b|api\.sendgrid\.com/gi },
	{ provider: "SparkPost", pattern: /(?:from\s+|require\(\s*|import\(\s*)["']sparkpost["']|\b(?:import|from)\s+sparkpost\b|api\.sparkpost\.com/gi },
];

const featurePatterns = [
	{ feature: "attachments", pattern: /\battachments?\b/gi },
	{ feature: "campaign or bulk sending", pattern: /\b(?:campaign|broadcast|bulk)\b/gi },
	{ feature: "CC or BCC", pattern: /\b(?:cc|bcc)(?:Email)?\s*[:=]/g },
	{ feature: "contact synchronization", pattern: /\b(?:create|update|upsert|sync)(?:Contact|Subscriber|Recipient)\s*\(/g },
	{ feature: "custom sender", pattern: /\b(?:fromOverride|fromEmail|fromName|sender)\s*[:=]/g },
	{ feature: "events", pattern: /\b(?:sendEvent|trackEvent|eventName)\b/g },
	{ feature: "idempotency", pattern: /\bidempotency(?:Key|-key)?\b/gi },
	{ feature: "marketing intent", pattern: /\bmarketing\s*[:=]/g },
	{ feature: "provider callbacks", pattern: /\b(?:bounce|complaint|delivery|inbound)\b.{0,30}\bwebhook\b|\bwebhook\b.{0,30}\b(?:bounce|complaint|delivery|inbound)\b/gi },
	{ feature: "reply-to", pattern: /\breplyTo(?:Email)?\s*[:=]/g },
	{ feature: "scheduled or delayed delivery", pattern: /\b(?:scheduledAt|sendAt|deliverAt|delay|schedule)\s*[:=(]/gi },
	{ feature: "suppression or unsubscribe", pattern: /\b(?:suppression|unsubscribe|subscribed)\b/gi },
];

const sendPatterns = [
	{ kind: "helper call", pattern: /\b(?:sendEmail|sendMail|sendTransactionalEmail)\s*\(/g },
	{ kind: "provider method", pattern: /\.(?:emails\.send|sendEmail|sendMail|messages\.send|messages\.create)\s*\(/g },
	{ kind: "event call", pattern: /\b(?:sendEvent|events\.send)\s*\(/g },
];

const textExtensions = new Set([
	".cjs",
	".cs",
	".env",
	".go",
	".html",
	".java",
	".js",
	".jsx",
	".json",
	".kt",
	".md",
	".mjs",
	".mjml",
	".php",
	".py",
	".rb",
	".rs",
	".sh",
	".toml",
	".ts",
	".tsx",
	".xml",
	".yaml",
	".yml",
]);

const manifestNames = new Set([
	"composer.json",
	"Gemfile",
	"go.mod",
	"package.json",
	"pyproject.toml",
	"requirements.txt",
]);

const ignoredDirectories = new Set([
	".git",
	".next",
	".output",
	".turbo",
	"build",
	"coverage",
	"dist",
	"node_modules",
	"target",
	"vendor",
]);

const runGit = (args) =>
	execFileSync("git", ["-C", root, ...args], {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "ignore"],
	}).trim();

const listRepositoryFiles = () => {
	try {
		const output = execFileSync(
			"git",
			[
				"-C",
				root,
				"ls-files",
				"-z",
				"--cached",
				"--others",
				"--exclude-standard",
			],
			{ encoding: "utf8" },
		);
		return output.split("\0").filter(Boolean);
	} catch {
		const files = [];
		const walk = (directory, prefix = "") => {
			for (const entry of readdirSync(directory, { withFileTypes: true })) {
				if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
				const relativePath = join(prefix, entry.name);
				const absolutePath = join(directory, entry.name);
				if (entry.isDirectory()) walk(absolutePath, relativePath);
				else if (entry.isFile()) files.push(relativePath);
			}
		};
		walk(root);
		return files;
	}
};

const lineStarts = (text) => {
	const starts = [0];
	for (let index = 0; index < text.length; index += 1) {
		if (text.charCodeAt(index) === 10) starts.push(index + 1);
	}
	return starts;
};

const lineNumberAt = (starts, index) => {
	let low = 0;
	let high = starts.length - 1;
	while (low <= high) {
		const middle = Math.floor((low + high) / 2);
		if (starts[middle] <= index) low = middle + 1;
		else high = middle - 1;
	}
	return high + 1;
};

const collectMatches = (text, patterns, file, keyName) => {
	const matches = [];
	let starts;
	for (const definition of patterns) {
		definition.pattern.lastIndex = 0;
		for (const match of text.matchAll(definition.pattern)) {
			starts ??= lineStarts(text);
			matches.push({
				[keyName]: definition[keyName],
				file,
				line: lineNumberAt(starts, match.index),
			});
		}
	}
	return matches;
};

const files = listRepositoryFiles().filter(
	(file) =>
		!file
			.split(/[\\/]/)
			.some((segment) => ignoredDirectories.has(segment)),
);
const packageMatches = [];
const rendererMatches = [];
const providerReferences = [];
const sendCandidates = [];
const featureSignals = [];
const templateCandidates = [];
const environmentVariables = new Set();
const configurationReferences = [];
const fileLineCounts = new Map();

for (const file of files) {
	const absolutePath = join(root, file);
	let stats;
	try {
		stats = statSync(absolutePath);
	} catch {
		continue;
	}
	if (!stats.isFile() || stats.size > 1_000_000) continue;

	const extension = extname(file).toLowerCase();
	const fileName = basename(file);
	if (!textExtensions.has(extension) && !manifestNames.has(fileName)) continue;

	let text;
	try {
		text = readFileSync(absolutePath, "utf8");
	} catch {
		continue;
	}
	fileLineCounts.set(
		file,
		text.length === 0
			? 0
			: text.split(/\r?\n/).length - (text.endsWith("\n") ? 1 : 0),
	);

	if (fileName === "package.json") {
		try {
			const manifest = JSON.parse(text);
			for (const section of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
				for (const [packageName, version] of Object.entries(manifest[section] ?? {})) {
					for (const definition of providerPackages) {
						if (definition.pattern.test(packageName)) {
							packageMatches.push({
								provider: definition.provider,
								package: packageName,
								version,
								section,
								file,
							});
						}
					}
					for (const definition of rendererPackages) {
						if (definition.pattern.test(packageName)) {
							rendererMatches.push({
								renderer: definition.renderer,
								package: packageName,
								version,
								section,
								file,
							});
						}
					}
				}
			}
		} catch {
			// Keep scanning malformed or commented manifests as text.
		}
	}

	const fileProviderReferences = collectMatches(
		text,
		providerSourcePatterns,
		file,
		"provider",
	);
	const fileSendCandidates = collectMatches(text, sendPatterns, file, "kind");
	providerReferences.push(...fileProviderReferences);
	sendCandidates.push(...fileSendCandidates);

	let hasProviderConfiguration = false;
	for (const match of text.matchAll(
		/\b(?:LOOPS|RESEND|POSTMARK|SENDGRID|MAILGUN|MAILERSEND|SPARKPOST|SMTP|AWS_SES|SES)_[A-Z0-9_]+\b/g,
	)) {
		environmentVariables.add(match[0]);
		configurationReferences.push({
			name: match[0],
			file,
			line: lineNumberAt(lineStarts(text), match.index),
		});
		hasProviderConfiguration = true;
	}

	const lowerPath = file.toLowerCase();
	const isManifest = manifestNames.has(fileName);
	const reactEmail =
		!isManifest && /["']@react-email\/[^"']+["']/.test(text);
	const mjml =
		!isManifest &&
		(extension === ".mjml" || /["']mjml(?:-|["'])/.test(text));
	const htmlTemplate =
		extension === ".html" &&
		/(?:email|mail|template|notification)/i.test(lowerPath);
	if (reactEmail || mjml || htmlTemplate) {
		templateCandidates.push({
			file,
			format: reactEmail ? "React Email" : mjml ? "MJML" : "HTML",
			role: /(?:^|\/)(?:components?|partials?|shared)\//i.test(lowerPath)
				? "shared"
				: "template",
		});
	}

	const structuralEmailFile =
		fileProviderReferences.length > 0 ||
		hasProviderConfiguration ||
		reactEmail ||
		mjml ||
		htmlTemplate ||
		/(?:^|\/)(?:emails?|mailers?|notifications?)(?:\/|\.|$)/i.test(lowerPath);
	if (structuralEmailFile || fileSendCandidates.length > 0) {
		const fileFeatureSignals = collectMatches(
			text,
			featurePatterns,
			file,
			"feature",
		);
		featureSignals.push(
			...fileFeatureSignals.filter(
				(signal) =>
					structuralEmailFile ||
					fileSendCandidates.some(
						(send) => Math.abs(send.line - signal.line) <= 50,
					),
			),
		);
	}
}

const dedupe = (items, keys) => {
	const seen = new Set();
	return items.filter((item) => {
		const key = keys.map((name) => item[name]).join("\0");
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
};

const dedupedProviderReferences = dedupe(providerReferences, [
	"provider",
	"file",
	"line",
]);
const dedupedSendCandidates = dedupe(sendCandidates, ["kind", "file", "line"]);
const dedupedConfigurationReferences = dedupe(configurationReferences, [
	"name",
	"file",
	"line",
]);
const candidateRoles = new Map();
const addCandidateRole = (file, role) => {
	const roles = candidateRoles.get(file) ?? new Set();
	roles.add(role);
	candidateRoles.set(file, roles);
};

for (const item of packageMatches) addCandidateRole(item.file, "provider dependency");
for (const item of rendererMatches) addCandidateRole(item.file, "renderer dependency");
for (const item of dedupedProviderReferences)
	addCandidateRole(item.file, "provider integration");
for (const item of dedupedSendCandidates)
	addCandidateRole(item.file, "send call");
for (const item of templateCandidates) addCandidateRole(item.file, item.role);
for (const item of dedupedConfigurationReferences)
	addCandidateRole(item.file, "configuration");

const candidateFiles = [...candidateRoles.entries()]
	.map(([file, roles]) => ({
		file,
		lines: fileLineCounts.get(file) ?? null,
		roles: [...roles].sort(),
	}))
	.sort((a, b) => a.file.localeCompare(b.file));

let git = null;
try {
	git = {
		head: runGit(["rev-parse", "HEAD"]),
		branch: runGit(["branch", "--show-current"]) || null,
		dirty: runGit(["status", "--porcelain"]).length > 0,
	};
} catch {
	git = null;
}

const result = {
	schemaVersion: 2,
	root,
	git,
	counts: {
		repositoryFiles: files.length,
		providerPackages: packageMatches.length,
		rendererPackages: rendererMatches.length,
		providerReferenceLocations: dedupedProviderReferences.length,
		sendCandidates: dedupedSendCandidates.length,
		templateCandidates: templateCandidates.length,
		environmentVariables: environmentVariables.size,
		candidateFiles: candidateFiles.length,
	},
	providerPackages: packageMatches,
	rendererPackages: rendererMatches,
	providerReferences: dedupedProviderReferences,
	sendCandidates: dedupedSendCandidates,
	templateCandidates,
	environmentVariables: [...environmentVariables].sort(),
	configurationReferences: dedupedConfigurationReferences,
	featureSignals: dedupe(featureSignals, ["feature", "file", "line"]),
	candidateFiles,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
