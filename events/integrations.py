"""Issue-tracker integrations (adapter pattern).

An IssueTrackerAdapter turns a Skylark error Group into an issue/ticket on an
external tracker. Add a provider by writing a new adapter + registering it in
ADAPTERS — callers (views, MCP) stay unchanged.
"""
import requests


def _issue_title(group):
    return (f"[Skylark] {group.title}" or "[Skylark] error")[:250]


def _issue_body(group, skylark_url):
    return (
        f"Captured by **Skylark** — level `{group.level}`, seen {group.count}×.\n\n"
        f"- Project: `{group.project.slug}`\n"
        f"- Fingerprint: `{group.fingerprint}`\n"
        f"- First seen: {group.first_seen}\n"
        f"- Last seen: {group.last_seen}\n\n"
        f"View in Skylark: {skylark_url}/\n"
    )


class IssueTrackerAdapter:
    key = None

    def create_issue(self, group, config, skylark_url):
        """Return {url, external_id, external_key}."""
        raise NotImplementedError

    @staticmethod
    def config_fields():
        """Field names this adapter needs in its Integration config."""
        return []


class GitHubAdapter(IssueTrackerAdapter):
    key = "github"

    @staticmethod
    def config_fields():
        return ["owner", "repo", "token"]

    def create_issue(self, group, config, skylark_url):
        owner, repo, token = config["owner"], config["repo"], config["token"]
        resp = requests.post(
            f"https://api.github.com/repos/{owner}/{repo}/issues",
            headers={
                "Authorization": f"token {token}",
                "Accept": "application/vnd.github+json",
            },
            json={
                "title": _issue_title(group),
                "body": _issue_body(group, skylark_url),
                "labels": ["skylark", group.level],
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "url": data["html_url"],
            "external_id": str(data["number"]),
            "external_key": f"#{data['number']}",
        }


class OssiconeAdapter(IssueTrackerAdapter):
    key = "ossicone"

    @staticmethod
    def config_fields():
        return ["url", "token", "project_id", "reporter_id"]

    def create_issue(self, group, config, skylark_url):
        base = config["url"].rstrip("/")
        resp = requests.post(
            f"{base}/api/issues",
            headers={
                "Authorization": f"Bearer {config['token']}",
                "Content-Type": "application/json",
            },
            json={
                "projectId": int(config["project_id"]),
                "reporterId": int(config["reporter_id"]),
                "title": _issue_title(group),
                "description": _issue_body(group, skylark_url),
                "type": "bug",
                "priority": "high" if group.level == "error" else "medium",
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "url": f"{base}/projects/{config['project_id']}",
            "external_id": str(data.get("id")),
            "external_key": data.get("key") or f"#{data.get('id')}",
        }


ADAPTERS = {a.key: a for a in [GitHubAdapter(), OssiconeAdapter()]}


def get_adapter(provider):
    adapter = ADAPTERS.get(provider)
    if adapter is None:
        raise ValueError(f"Unknown integration provider: {provider}")
    return adapter
