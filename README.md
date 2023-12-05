# 0x04. Files manager

This project is a summary of this back-end trimester: authentication, NodeJS, MongoDB, Redis, pagination and background processing.

The objective is to build a simple platform to upload and view files:

- User authentication via a token
- List all files
- Upload a new file
- Change permission of a file
- View a file
- Generate thumbnails for images

You will be guided step by step for building it, but you have some freedoms of implementation, split in more files etc… (`utils` folder will be your friend)

Of course, this kind of service already exists in the real life - it’s a learning purpose to assemble each piece and build a full product.

Enjoy!

## Resources

### Read or watch:

- [Node JS getting started](https://nodejs.org/en/docs/guides/getting-started-guide)
- [Process API doc](https://node.readthedocs.io/en/latest/api/process/)
- [Express getting started](https://expressjs.com/en/starter/installing.html)
- [Mocha documentation](https://mochajs.org/)
- [Nodemon documentation](https://github.com/remy/nodemon#nodemon)
- [MongoDB](https://github.com/mongodb/node-mongodb-native)
- [Bull](https://github.com/OptimalBits/bull)
- [Image thumbnail](https://www.npmjs.com/package/image-thumbnail)
- [Mime-Types](https://www.npmjs.com/package/mime-types)
- [Redis](https://github.com/redis/node-redis)

## Learning Objectives

- how to create an API with Express
- how to authenticate a user
- how to store data in MongoDB
- how to store temporary data in Redis
- how to setup and use a background worker

## Requirements

- Allowed editors: `vi`, `vim`, `emacs`, `Visual Studio Code`
- All your files will be interpreted/compiled on Ubuntu 18.04 LTS using `node` (version 12.x.x)
- All your files should end with a new line
- A `README.md` file, at the root of the folder of the project, is mandatory
- Your code should use the `js` extension
- Your code will be verified against lint using ESLint

---

## Don’t forget to run $ `npm install` when you have the `package.json`

---

## Program Setup

---

### `Start Server`

```
:~$ npm run start-server
```

### `Start Worker`

```
:~$ npm run start-worker
```

---

## Core Technologies

| ![Image 1](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTCxVvmk61dnihi9bEfgmV6gatFih8ZuLu7qMOxPpirUCK12JPSWg1SJsOpfxqeZIpZ7c&usqp=CAU) | ![Image 2](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsNwjcbWvkYp-rn5vOCMeNkNUl9kmquTAon0br1DNfgdTEYdW2qr4lnLVtdeRg7zBrOMk&usqp=CAU) | ![Image 3](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRXBM7fu342qxqm35OYtXyzQGu4Ef0k62-o3uojpg11o8l9AdMUT1Ucl73U62fqKL0Zn4Y&usqp=CAU) |
| :----------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------: |

---

## Dependencies

| ![image 1](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgezndC12xmQIGADp2K-Bp5gwbN1tuZgF571jE8QG4V3hlrNjXb9g0dpSXe4YWCh_Nf8Q&usqp=CAU) | ![image 1](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoMHgl3DoGsc2w9pO5v8q1SPOfojrwak4UDRY-a4iowTVZsQ3Ka8iQhZWb5c9Nd2svx1Y&usqp=CAU) | ![Image 3](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBISO-hGicQlPBBLMVqqhQZEjycsQDQdwaapFoRtQ2zBcNcvB-G4cMwxK8SnjDOBbLJ1w&usqp=CAU) |
| :----------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------: |

---

## Author

Colin Ochieng: colinokumu89@gmail.com
