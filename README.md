## MeBay
---

This is a project I have created for Cloud Computing (CENG495) class at METU.
The purpose of this project was to use MongoDB Stitch API to create an app without paying for or provisioning any server for database. We had the liberty to not deploy our application anywhere if the app could be built and seen without much hassle so this one is not deployed anywhere for the hw (maybe i'll put it to GitHub Pages). This is only to demo MongoDB and stitch usage (I haven't made the best decisions for this :D )

---

### Ozan Incesulu e2099711


##### Install & Build:

You need to have Node.js and NPM to build the project.
Run build.sh to install dependencies and compile the JS.
You may run compile.sh to skip dependency check after one successful build.

##### Design Choices

I have created a simple framework that can be used to manage state and render basic HTML templates. The reason is I am not satisfied with all the complexities that are required to install some basic app framework these days (especially all the stuff with React and Webpack). I haven't used Elm for this project since using Stitch as an external dependency to the code would be too cumbersome.

I have loaded all users from the database for the application state, since product viewing route needs all state to show all products of all sellers and the user home view needs it to recalculate ratings given for a product.

I have created only one collection, stored all orders on buyer's side and products on seller's side, considering the deletion policies would be best fit this way.

##### User's Guide

I consider the UI to be intuitive, thus I didn't create a guide.

##### External Dependencies:
* [JQuery](https://jquery.com/) and [Popper.js](https://popper.js.org/) for functionality
* [Bootstrap](https://getbootstrap.com/) for styling
* [MongoDB Stitch](https://www.mongodb.com/cloud/stitch) to connect to MongoDB backend
* [Typescript](https://www.typescriptlang.org/) for static type checking of the application.
* [Browserify](http://browserify.org/) Library bundler for client-side JS applications, used to bundle different files.

##### File Structure:
* index.html -> File that loads public/index.html
* public -> Contains the deployable parts of the app
  * index.html -> Contains the main entrypoint and page templates
  * js/bundle.js -> Bundled js file created automatically by browserify
  * css/overlay.css -> Code to generate Loading... overlay
* src -> Contains TS source code for the app
  * framework.ts -> A basic framework I created to handle basic template rendering and redux-like state management without overhead
  * index.ts -> entrypoint of app
  * logout.ts -> Route logic for logging user out
  * mongoOps.ts -> operations performed on MongoDB, abstracted for general use
  * product.ts -> Route logic for the product listing page
  * userHome.ts -> Route logic for user's home 
  * userSelect.ts -> Route logic for user selection page
* build.sh -> Script for building the app
* compile.sh -> Script to only compile the app
* package.json / package-lock.json -> npm package resolution files
* tsconfig.json -> Typescript compiler configuration