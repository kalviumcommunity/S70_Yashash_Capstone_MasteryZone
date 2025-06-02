const express = require("express");
const router = express.Router();

const { getAllUsers, createUser, updateUser } = require("./Controllers/userController");
const { getAllAdminLogs, createAdminLog, updateAdminLog } = require("./Controllers/adminLogController");
const { getAllDiscussions, createDiscussion, updateDiscussion } = require("./Controllers/discussionController");
const { getAllEvents, createEvent, updateEvent } = require("./Controllers/eventController")
const { getAllGroups, createGroup, updateGroup } = require("./Controllers/groupController");
const { getAllNotifications, createNotification, updateNotification } = require("./Controllers/notificationController");
const { addUserToGroup } = require('../controllers/groupController');
const { getAllProgress, createProgress, updateProgress } = require("./Controllers/progressController");
const { getAllResources, createResource, updateResource } = require("./Controllers/resourceController");
const express = require('express');
const router = express.Router();

router.post('/add-user', addUserToGroup);

module.exports = router;

//USER routes
router.get('/users', getAllUsers)
router.post('/create', createUser)
router.put("/update/:id", updateUser)


// ADMIN routes
router.get('/admin', getAllAdminLogs)
router.post('/createAdmin', createAdminLog)
router.put("/updateAdmin/:id", updateAdminLog)


// DISCUSSION routes
router.get('/discussions', getAllDiscussions)
router.post('/createDiscussions', createDiscussion)
router.put("/updateDiscussions/:id", updateDiscussion)


// EVENTS routes
router.get('/events', getAllEvents)
router.post('/createEvents', createEvent)
router.put("/updateEvents/:id", updateEvent)


// GROUPS routes
router.get('/groups', getAllGroups)
router.post('/createGroups', createGroup)
router.put("/updateGroup/:id", updateGroup)


// NOTIFICATIONS routes
router.get('/notifications', getAllNotifications)
router.post('/createNotification', createNotification)
router.put("/updateNotification/:id", updateNotification)


// PROGRESS routes
router.get('/progress', getAllProgress)
router.post('/createProgress', createProgress)
router.put("/updateProgress/:id", updateProgress)


// RESOURCES routes
router.get('/resources', getAllResources)
router.post('/createResources', createResource)
router.put("/updateResources/:id", updateResource)

router.post('/add-user', addUserToGroup);


module.exports = router;
