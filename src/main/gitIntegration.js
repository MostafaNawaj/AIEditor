import simpleGit from 'simple-git';

export async function getStatus(repoPath) {
  try {
    const git = simpleGit(repoPath);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) return { isRepo: false };

    const status = await git.status();
    return {
      isRepo: true,
      branch: status.current,
      staged: status.staged,
      modified: status.modified,
      notAdded: status.not_added,
      deleted: status.deleted,
      ahead: status.ahead,
      behind: status.behind,
    };
  } catch (err) {
    return { isRepo: false, error: err.message };
  }
}

export async function getDiff(repoPath) {
  try {
    const git = simpleGit(repoPath);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) return { isRepo: false };

    const diff = await git.diff();
    return { isRepo: true, diff };
  } catch (err) {
    return { isRepo: false, error: err.message };
  }
}
