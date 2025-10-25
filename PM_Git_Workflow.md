# Project Manager Git Workflow - CashFlow

## Repository Setup ✅ COMPLETE
- Repository cloned from: https://github.com/daveagabi/CashFlow.git
- All branches configured locally:
  - `main` (production)
  - `integration` (your main working branch)
  - `frontend` (team branch)
  - `backend` (team branch)
  - `ai-engine` (team branch)

## Your Git Flow
```
frontend ─┐
backend ──┼──▶ integration ───▶ main
ai-engine ─┘
```

## Daily Commands (use in CashFlow directory)

### Check current status
```bash
git status
git branch
```

### Pull latest changes from team branches
```bash
git checkout integration
git pull origin Integration

# Merge team branches into integration
git merge frontend
git merge backend
git merge ai-engine
```

### Commit and push your changes
```bash
git add .
git commit -m "Your commit message"
git push origin integration
```

### Deploy to main (when stable)
```bash
git checkout main
git pull origin main
git merge integration
git push origin main
git tag v1.0-demo
git push origin v1.0-demo
```

## Git Path for Commands
Since git isn't in your PATH, use this prefix for all commands:
```
& "C:\Program Files\Git\bin\git.exe" -C CashFlow [command]
```

## Current Branch: integration
You're ready to start managing the project!