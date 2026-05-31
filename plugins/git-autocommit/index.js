import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { env } from "node:process";

const execFileAsync = promisify(execFile);

/**
 * Stage all changes and fire a background commit in the target repo.
 * @param {string} repoDir
 */
async function stageAndCommit(repoDir) {
  const opts = { cwd: repoDir, timeout: 10_000 };

  try {
    await execFileAsync("git", ["add", "-A"], opts);
    const { stdout: status } = await execFileAsync("git", ["status", "--porcelain"], opts);
    if (!status.trim()) return;

    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    const message = `auto: snapshot before agent turn [${timestamp} UTC]`;
    execFile("git", ["commit", "-m", message], opts, () => {});
  } catch (_err) {
    // git fails silently
  }
}

/**
 * Resolve repo directory:
 * 1. Plugin config (repoDir) — set in openclaw.json
 * 2. GIT_AUTOCOMMIT_REPO env var
 * 3. The OpenClaw workspace dir (ctx.workspaceDir)
 */
function resolveRepoDir(config, ctx) {
  if (config?.repoDir) return config.repoDir;
  if (env.GIT_AUTOCOMMIT_REPO) return env.GIT_AUTOCOMMIT_REPO;
  return ctx.workspaceDir;
}

const plugin = {
  id: "git-autocommit",
  name: "Git AutoCommit",
  description:
    "Stages and commits repo changes before every OpenClaw agent turn. " +
    "Configure repoDir in plugin config or set GIT_AUTOCOMMIT_REPO env var.",
  config: {
    repoDir: {
      type: "string",
      description: "Path to git repo to auto-commit (default: agent workspace)",
    },
  },
  register(api) {
    api.on("agent_turn_prepare", async (_event, ctx) => {
      const repoDir = resolveRepoDir(api.config, ctx);
      if (!repoDir) return;
      await stageAndCommit(repoDir);
    });
  },
};

export default plugin;
