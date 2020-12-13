Recipe Bank

Requirements List
1.	Node.js app
Yes
See, package.json 
	
2.	Home page with links to all other pages
Yes
See, /views/homepage.ejs 29-41
		
3.	Register page
yes, see /reigster
See routes.js  29-41
See /views/auth.ejs 
	
4.	User authentication page 
Yes, see /auth
See routes.js 33-35
See /views/auth.ejs 
	
5.	Add recipe page
Yes, see  /recipe/new
See routes.js 151
See /views/recipe-form.ejs 
	
6.	Update recipe page
yes, see /recipe/id/update
See routes.js line 230
See /views/recipe-form.ejs 
	
7.	Delete recipe page
Yes, see /recipe/id/delete
See routes.js -> line 269
	
8.	List page
Yes, see /recipes
See routes.js line 124
See /views/recipe-list.ejs
	
9.	Forms have validations
Yes, all fields have to be filled out, recipe duration cant be negative,
ingredient amount has to be number, username cant be dublicate,
recipe difficulty has to be easy, medium or hard.
See /views/recipe-form.ejs -> line 85
	
10.	Feedback messages to the user
Yes, if title, description or ingredient name are missing when submitting a recipe.
See /views/recipe-form.ejs -> line 85
	
11.	CRUD operations on database
Yes, used by /recipe/new , /recipes, /recipe/id/update and /recipe/id/delete
See api.js 
	
12.	Create & update operations take input data from forms
Yes, at create at /recipe/new and update at /recipe/id/update
See /views/recipe-form.ejs 242
See routes.js 
	
13.	Login process uses sessions
 Yes, using express sessions.
See routes.js
	
14.	Passwords should be hashed
Yes, using bcrypt.
 See routes.js line 91
	
15.	Logout
Yes, located in nav bar once logged in.
 See routes.js line 115
	
16.	Basic api
Yes
See api.js
	
17.	Links on all pages to home page
yes, consistent nav bar 14

Accessing the API
My api features GET, PUT, POST and DELETE methods. 
GET ALL (/api/recipe/all)
 POST (/api/recipe/new), 
 PUT (/api/recipe/:id) 
 DELETE (/api/recipe/:id) do however require authentication.


Data Model 
I decided to use Mongoose for managing my MongoDB databank
My database consists of two collections: user and recipe.
For example, a user's ID (unique), username (unique) and password (hashed) are stored in a schema like this:
{
	"id": "",
	"username": "",
	"password": "",
}
I have created a similar model to store recipe data. 
For example, a recipe is stored in a schema like this:
{
    "title": "",
    "difficulty": "",
    "duration": num,
    "ingredients": [
    	{
    		"name": "",
    		"amount": num,
    		"unit": ""
    	},
    	{
    		"name": "",
    		"amount": num,
    		"unit": "g"
    	},
    	{
    		"name": ""
    	}
    ],
    "description": ""
}
These two collections, user and recipe, are related by a one-to-many relationship.

Resources
Mongoose
https://mongoosejs.com/
Uid-safe
https://www.npmjs.com/package/uid-safe
Axios
https://www.npmjs.com/package/axios
Moment
https://momentjs.com/
Lodash Capitalize
https://lodash.com/
EJS
https://ejs.co/
Express Session
https://github.com/expressjs/session
Bcyrpt
https://www.npmjs.com/package/bcrypt
Nodemon
https://www.npmjs.com/package/nodemon
Postman
https://www.postman.com/

Sources
Disabling Text Selection Highlighting
https://stackoverflow.com/questions/826782/how-to-disable-text-selection-highlighting
