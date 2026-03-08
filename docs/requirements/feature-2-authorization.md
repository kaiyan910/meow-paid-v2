# Feature 2: Authorization

## Requirement

- integrate the login page with supabase authorization
  > only allow email and password login
- the login form should be created by using tanstack form
- change "username" field to "email" field
- add checking on the "email" field make sure it is in valid email format, if not valid show error below the form field in real-time
- add checking on the "password" field make sure it is at least 6 characters, if not valid show error below the form field in real-time
- integrate tanstack form with Zod to ensure data type is correct before sending to supabase
- add a loading icon to the form submit button to provide better UX
- after login send the user to a main page (just show the user email at the moment)
- for people who are not logged in and access to the main page should redirect them back to login page