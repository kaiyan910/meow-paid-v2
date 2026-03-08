# Feature 7: Statisitic Page

## Requirements
- a tab bar should be placed at the top part of the `content` section, tab items includes:
  - This Month
  - Last 6 Months
- the content should place udner the tab bar
- by default user click on the statistic icon on navigation bar will show the `This Month` tab

### This Month
- the UI can be kept like existing layout, i.e.
  - total expenses
  - category breakdown
- remove the monthly trend
- update to get the data from supabase, add supabase database functions if needed

### Last 6 Months

#### UI
- `payment type` dropdown
  - get data from supabase database `payment_type` table
  - on top of the row item extra add a `Total` option to indicate all payment type
- `payment subtype` dropdown
  - the option values change dynamically based on `payment type` dropdown
    - query supabase database `payment_subtype` base on the `payment_type_id`
    - beside the values from database extra add a `All` option to indicate all payment subtype
  - if the value of `payment type` is `Total` then disable the `payment subtype` dropdown
- base on the value from `payment type` and `payment subtype` query the database to get the total transaction price of the each month for the last 6 months
  - draw each month's value with bar chart using the shadcn charting components
  - show the average value for 6 months for this `payment type` and `payment subtype`
- add supabase database functions if needed

## Revision 1

- for the `Last 6 Months` bar chart remove the Y-axis price label

## Revision 2

### `Last 6 Months` bar chart

- if there is no data for all 6 months then don't show the chart instead some a `No Data` label and icon to indicate it
- if there is partial data available on the past 6 months, the x-asix still need to show all months, but the y-axis just show 0
  - currently if data is missing for some month it will just show the month with data in x-asix

## Revision 3

- please remove the action button on top of the header when accessing `statistics` page

### `Last 6 Months` bar chart

- give a small label on each barchart to show the y-axis value