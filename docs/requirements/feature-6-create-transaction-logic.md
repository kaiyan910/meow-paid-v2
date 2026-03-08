# Feature 6: Create Transaction Logic

## Requirement

### UI (List)
- top part of the "content" section should include a calendar selection for users to switch between difference month of different years
- it should have clear text to show the users currently showing transactions belong to which month
- below the calendar it shows a list transactions
  - the transactions should be sort by the transaction date in desc. order
- each row items should include
  - transaction date
  - the shop logo
  - the shop name
  - the shop category
  - the payee of the transactions
  - the price of the transactions
  - a delete button to remove the transaction
  - a edit button to modify the transaction
- by clicking on the row item it will slide down a details view to show the transaction details
  - i.e. showing the composite of different payment type and its price, e.g.
    - snack     -$40
    - cooking   -$50
    - drinks    -$40
- when pressing the action button on the header it will navigate to the Create Transaction Page 

### UI (Create Transaction)
- show a form to create a new transaction

#### Transaction Date
- type: a datepciker
- validation: cannot be NULL

#### Shop
- type: autocomplete text field
- data provider: from supabase `shop` table, use `name` field
- validation: cannot be NULL

#### Payee
- type: dropdown
- data provider: from supabase `profile` table, use `display_name` field
- validation: cannot be NULL

#### Payment Details
- type: a composite component
  - dropdown: from supabase `payment_subtype`, use `name` field
    - validation: cannot be NULL
  - price: double value
    - validation: valid positive double value
- validation: must have at least one
- user can dynamically add more of this composite components
- the total cost of this transaction will be the sum of all price

#### Remark
- type: text field
- validation: cannot be empty but cannot exceed 100 characters

## Database Model

### transactions
- id
- transaction_date: timestamptz NOT_NULL
- shop: `shops`.id NOT_NULL
- payee: `auth`.`users`.id NOT_NULL
- price: double NOT_NULL 
  - should be in-sync with sum of all `transaction_items` with the same `transactions`.id
- remark: text NULLABLE
- created_at: timestamptz default now()

### transaction_items
- id
- transaction: `transactions`.id NOT_NULL
- payment_subtype: `payment_subtypes`.id NOT_NULL
- price: double NOT_NULL
- created_at: timestamptz default now()

## Revision 1

- create form `remark` can be NULL, the validation should be skip but the text limit should still apply

## Revision 2

### Transaction List Item

- show the `remark` field if it is available

### Create Transaction Page

- by default select today date as the `transaction date`
- for the payment details section the height of the subtype dropdown and the price input field is inconsistent, please make it the same height
  - use playwright to check it if needed
  - use a/c: 
    - username: kaiyan@crookk.com
    - password: Abc1234!

#### Calculator Function

- next to the `price` field inside each payment details please add a calculator button
- by clicking the button a popup with a calculator UI will be prompted
- users can use this UI to do simple calculation like "+" "-" "*" "/"
- the default value of the calculator will be the price inputed on the `price` field
- when user press a "OK" or "Confirm" button on the popup the new value will be updated to the specific `price` field

## Revision 3 

### Trnasacation List Item

- add a `edit` button to each list item to allow user to modify the transaction

### Create Transaction Page

- payment details `price` field should only allow to input double with 1 decimal point value current it allow 2 decimal points

#### Calculator Function

- the calculator should bring the payment detials `price` to the dialog initial value
  - currently when I input say `60` into the `price` field and press the `calculator` button it does not bring `60` to the `calculator`

## Revision 4

### Transaction List Page

- when user pressed on the `current month` it should provide a drop down to allow user fast navigate to different year and month