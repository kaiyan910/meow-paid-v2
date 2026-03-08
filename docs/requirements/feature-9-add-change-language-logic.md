# Feature 9: add change language logic

## Requirement
- add a language dropdown above `logout` button in `meta` page
  - the app support 2 languages: English (en.json) and Tranditional Chinese (zh.json)
- the dropdown should have options:
  - English
  - 正體中文
- by default the language of this app should follow the browser configs
- when user change the language using this dropdown, then the value should override the default language
- the value should save to the localstorage when next time user access the application should retrieve it from the localstorage first, if not exist then use browser settings