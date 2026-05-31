import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Stage all changes and fire a background commit in the target repo.
 * Staging is synchronous (~50ms); commit is background so agent never waits.
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
    // git fails silently — don't block the agent
  }
}

const plugin = {
  id: "git-autocommit",
  name: "Git AutoCommit",
  description: "Stages and commits tribev2 repo changes before every agent turn",
  register(api) {
    api.on("agent_turn_prepare", async (_event, ctx) => {
      // Target the tribev2 repo, not the OpenClaw workspace
      await stageAndCommit("/workspaces/tribev2");
    });
  },
};

export default plugin;
