# Archive of Non-Roofing Files

This directory contains files that were moved from the main repository tree because they did not contain roofing-related keywords in their content or filenames.

## Criteria Used

Files were scanned for the following roofing-related keywords (case-insensitive):
- roof, roofing, quote, estimate, measurement, measure, pitch
- AR, RoofMeasurement, QuoteService, customer, client, shingle
- gutter, leak, inspection, material, scraps, waste factor
- invoice, contractor, job, property, roofdoctors, roofingco

## Moved Files

The following files were moved on 2025-08-25:

### App.js
- **Original path:** `App.js`
- **Archived path:** `archive-non-roofing/App.js`
- **Reason:** Empty file, App.tsx is the actual entry point
- **Size:** 0 bytes

## Conservative Approach

This archive was created using a conservative approach. Only clearly non-essential files were moved to ensure the application continues to function correctly. Additional files that technically don't contain roofing keywords (such as configuration files, assets, and some test files) were left in place because they are essential for the application's operation.

## How to Restore Files

If you need to restore any archived files:

### Restore individual files:
```bash
git restore archive-non-roofing/path/to/file --source=HEAD --staged --worktree
mv archive-non-roofing/path/to/file path/to/file
```

### Restore all archived files:
```bash
# Move all files back to their original locations
find archive-non-roofing -type f | while read file; do
  original_path="${file#archive-non-roofing/}"
  mkdir -p "$(dirname "$original_path")"
  mv "$file" "$original_path"
done

# Remove the empty archive directory
rmdir archive-non-roofing 2>/dev/null || rm -rf archive-non-roofing
```

### Using git to restore (if committed):
```bash
git checkout HEAD~1 -- path/to/original/file
```

## Notes

- All files are preserved in this archive with their complete directory structure
- This is a reversible operation - no data was permanently deleted
- The main tree now contains only roofing-related functionality
- If additional cleanup is desired, it can be done in a follow-up PR after review