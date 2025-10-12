# Job-Based Access Report Feature Implementation

## Overview

This document describes the implementation of job-based access reports in the MyReports component. This feature allows property owners to generate reports showing which assets are accessible via specific job PINs for tradies.

## Changes Made

### 1. **New Imports Added**

- `fetchJobsInfo` - Fetches all jobs for a property
- `Job`, `JobAsset` - TypeScript types for job data
- `fetchJobAssetsWithDetails` - Fetches detailed asset information for a specific job

### 2. **New State Variables**

```typescript
const [propertyJobs, setPropertyJobs] = useState<Job[]>([]);
const [jobAssets, setJobAssets] = useState<JobAsset[]>([]);
const [loadingJobs, setLoadingJobs] = useState(false);
const [selectedJob, setSelectedJob] = useState<Job | null>(null);
const [jobAccessibleAssets, setJobAccessibleAssets] = useState<any[]>([]);
```

### 3. **Dynamic Report Types**

The `reportTypes` array now includes:

- **Property Overview** - Original full property report
- **Maintenance History** - Original maintenance report
- **Job Access Report: [Job Title]** - Dynamic entries for each job/maintenance task

Each job automatically creates a new report type option showing the job title.

### 4. **Job Data Fetching**

New useEffect hook that:

- Fetches all jobs when a property is selected
- Loads job-asset relationships
- Updates the report type dropdown with job options

### 5. **Job Selection Handler**

When a job report type is selected:

- Loads the selected job details
- Fetches accessible assets for that specific job
- Automatically pre-selects only the assets accessible via the job's PIN
- Disables selection controls (assets are pre-determined by the job)

### 6. **Enhanced UI Elements**

#### Job Information Panel

When a job report is selected, displays:

- Job title
- Job PIN (highlighted in badge)
- Job status (PENDING, ACCEPTED, etc.)
- Number of accessible assets
- Access expiration date
- Important note about PIN-based access

#### Asset Selection Section

- Shows label indicating "Only assets accessible via PIN XXX"
- For non-job reports: Shows all spaces and assets with selection controls
- For job reports:
  - Only displays spaces that contain accessible assets
  - Shows "X accessible" badge next to space names
  - Shows "✓ Accessible" badge next to accessible assets
  - Disables checkboxes (assets are auto-selected based on job)
  - Hides the "Select Everything" checkbox

### 7. **PDF Generation Enhancements**

#### Filename Generation

Job reports use a descriptive filename:

```
property_{propertyId}_job_{jobTitle}_pin_{PIN}.pdf
```

#### Job Information Section in PDF

Adds a prominent blue-bordered section in the PDF showing:

- Job title and PIN (in monospace font with special styling)
- Job status and creation date
- Number of accessible assets
- Access expiration time
- Important note explaining that the report shows only PIN-accessible areas

### 8. **Validation**

Enhanced validation in `handleGenerateReport`:

- Checks if job data is loaded when generating job reports
- Displays appropriate error messages if job data is missing

## User Flow

### Generating a Job Access Report

1. **Select Property**

   - User selects a property from the dropdown

2. **Automatic Job Loading**

   - System fetches all jobs for the selected property
   - Job report options appear in the "Report Type" dropdown

3. **Select Job Report**

   - User selects "Job Access Report: [Job Name]" from dropdown
   - System displays job information panel with PIN and details

4. **Automatic Asset Selection**

   - System automatically selects only assets accessible via the job's PIN
   - Asset list shows only accessible spaces and assets
   - Selection controls are disabled (pre-determined by job configuration)

5. **Generate Report**
   - User clicks "Generate Report"
   - PDF is created showing:
     - Job information prominently displayed
     - Only the accessible sections and assets
     - PIN number for reference

## Use Case

### Scenario: Plumber Access Report

A property owner has hired a plumber to fix the bathrooms. They:

1. Created a job "Bathroom Plumbing Repair" with PIN `672512`
2. Assigned access to: Main Bathroom (sink, toilet, shower) and Guest Bathroom (sink, toilet)
3. Generate a job access report by:
   - Selecting the property
   - Choosing "Job Access Report: Bathroom Plumbing Repair"
   - Clicking "Generate Report"

The resulting PDF shows:

- The job title and PIN `672512`
- Only the Main Bathroom and Guest Bathroom sections
- Only the assets (sink, toilet, shower) the plumber can access
- Access expiration date

The owner can share this report with the plumber or keep it for records.

## Technical Benefits

1. **Security Documentation** - Clear record of what each tradie can access
2. **Access Transparency** - Tradies know exactly which areas they can enter
3. **Audit Trail** - Historical record of access permissions via dated reports
4. **Time-Limited Access** - Shows expiration dates for temporary access
5. **Professional Communication** - Clean, professional PDF to share with contractors

## Future Enhancements

Potential improvements:

- Add QR code with PIN to the PDF for easy mobile access
- Include photos of accessible areas only
- Add access log/history if available
- Support for multiple job filtering
- Email report directly to tradie
- Print-optimized layout with tear-off PIN section

## Files Modified

- `frontend_web/src/components/MyReports.tsx` - Main implementation file

## Dependencies

Existing dependencies used:

- `JobService.ts` - Job data management
- `FetchData.ts` - Property data fetching
- Supabase client - Database connectivity
