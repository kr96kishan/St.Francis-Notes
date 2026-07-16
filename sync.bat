@echo off
echo Syncing local changes to GitHub and Lovable...
git add -A
git commit -m "Local update"
git push origin main
echo.
echo ===================================================
echo Done! Your changes have been pushed to GitHub.
echo Lovable will automatically sync them shortly.
echo ===================================================
pause
