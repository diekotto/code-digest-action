# Project enhancement roadmap

This document describes the enhancements and extensions planned for the Code Digest Generator action.

- Identify clear cases of files that do not provide any value but should be included in repos. Such as `package-lock.json`. Ignore them by default.
- Change the default output to text-only.
- Review the use of include binary, it seems silly. This project is intended to make a readable summary of a directory.
- Remove the entire directory location from the metadata, the summary does not need to identify where the folder is located on the user's disk.
- Check possible error or add configuration, when `--include-dot` is false, the program adds folders with `.` prefix anyway. The tree output does it correctly but it seems that the summary does not.
- As the npx command can potentially be ran inside a repository, adding a gitignore in the output folder may be useful.
