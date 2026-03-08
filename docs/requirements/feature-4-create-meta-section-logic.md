# Feature 3: create meta section logic

## Requirement
- for the meta section page there are 4 meta data that need to be managed
  - 商店  
  - 商店類型  
  - 支出類型  
  - 支出子類型  
- place a tab bar on top of the "content" section, 
- show each type of meta data as the a tab item
- by pressing on the tab item the "content" section under the tab will change to the specific meta management page
  - it will show the list of meta  
  - each of the list item will show its specific data with a delete button  
  - the top right action button of the header is a "create" action for the meta data  
  - by clicking the "create" button a popup will be prompted to provide a create form for the specific meta data
  - by clicking the list item a edit popup will be prompted and allow the user to change its attributes

## Data Model
- make sure the create form of each meta contains the data field shown as below

### Shop
- label: 商店
- attributes: name, shop_category, logo

### Shop Category
- label: 商店類型
- attributes: name

### Payment Type
- label: 支出類型
- attributes: name

### Payment sub-type
- label: 支出子類型
- attributes: name, payment_type

## Revision 2

### Shop Form
- the logo field need to be a file upload
- the uploaded file should stored in supabase storage and path should stored in the database
#### Form Validation
- name should not be empty
- shop_category should not be empty
- logo should not be empty

### Shop Category
#### Form Validation
- name should not be empty

### Payment Type
#### Form Validation
- name should not be empty

### Payment SubType
#### Form Validation
- name should not be empty
- payment_type should not be empty

## Revision 3

### Shop Form
- show the logo on the list item
- refer the `docs/bugs/B01-layout-gitch.png` fix the UI problem on the Shop Edit Form

## Revision 4

### Popup Create Form
- reset the Popup Form state when the dialog is closed
- currently the state (i.e. the field input) still keep with the last input
- whenever a user click on the create action button the form should be blank with a complete new state