# Define variables
$devRepo = "https://github.com/Haniasahar/elevate-spaces"  # Replace with your development repo URL
$clientBranch = "master"                            # Replace with your client branch name
$devBranch = "main"                               # Replace with your development branch name
$frontendFolder = "frontend"
$commitMessage = "Merged all changes from dev repo into one commit"  # Customize your commit message
$authorName = "Saifullah Ahmed"  # Author name
$authorEmail = "saifullahahmed380@gmail.com"  # Author email

# Step 1: Add the development repository as a remote (if not already added)
git remote add dev $devRepo 2>$null
Write-Host "Development repository added as remote 'dev'."

# Step 2: Pull the latest changes from the development repository
Write-Host "Pulling changes from development repository..."
git fetch dev $devBranch

# Step 3: Create a temporary branch and squash all commits
Write-Host "Squashing all commits from dev repo into one..."
git checkout -b temp-merge-branch dev/$devBranch
git reset --soft $(git rev-list --max-parents=0 HEAD)  # Reset to the first commit
git add .
git commit --author="$authorName <$authorEmail>" -m "$commitMessage"

# Step 4: Move files from 'frontend' folder to the root
if (Test-Path $frontendFolder) {
    Write-Host "Moving files from '$frontendFolder' to root..."
    Move-Item -Path "$frontendFolder\\*" -Destination "." -Force
    Write-Host "Files moved successfully."

    # Step 5: Remove the empty 'frontend' folder
    Write-Host "Removing the '$frontendFolder' folder..."
    Remove-Item -Recurse -Force $frontendFolder
    Write-Host "'$frontendFolder' folder removed."
} else {
    Write-Host "No '$frontendFolder' folder found. Skipping move step."
}

 # Step 6: Push the single commit to the client repository
 Write-Host "Pushing the single commit to the client repository..."
 git checkout $clientBranch
 git merge --squash temp-merge-branch --allow-unrelated-histories
 git commit --author="$authorName <$authorEmail>" -m "$commitMessage"
 git push origin $clientBranch --force

# Step 7: Clean up temporary branch
git branch -D temp-merge-branch

Write-Host "Automation complete. All commits merged into one and pushed to the client repository."