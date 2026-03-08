# Feature 8: Transfer

## Requirement
- top part of the "content" section should include a calendar selection for users to switch between difference month of different years
  - when user pressed on the `current month` it should provide a drop down to allow user fast navigate to different year and month
  - same as `transaction` page
- below the calendar section show a simple summary section:
  - current month total expense
    - show on left side
  - the average cost each users need to pay back
    - show on right side
- below the summary section show a list of users and each row should include data:
  - display name of the user
  - total amount paid by the user
  - the amount of money need to paid back
    - i.e. average cost - total amount paid by user
    - if the result is a negative number show 0.0
- feel free to add any new supabase database function to support it