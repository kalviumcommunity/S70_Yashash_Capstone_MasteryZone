const express = require("express");
const router = express.Router();

const { getAllUsers, createUser } = require("./userControllers/userController");
const { getAllAdminLogs, createAdminLog } = require("./userControllers/adminLogController");
const { getAllDiscussions, createDiscussion } = require("./userControllers/discussionController");
const { getAllEvents, createEvent } = require("./userControllers/eventController")
const { getAllGroups, createGroup } = require("./userControllers/groupController");
const { getAllNotifications, createNotification  } = require("./userControllers/notificationController");
const { getAllProgress, createProgress } = require("./userControllers/progressController");
const { getAllResources, createResource } = require("./userControllers/resourceController");

//USER routes
router.get('/users', getAllUsers)
router.post('/create', createUser)


// ADMIN routes
router.get('/admin', getAllAdminLogs)
router.post('/createAdmin', createAdminLog)


// DISCUSSION routes
router.get('/discussions', getAllDiscussions)
router.post('/createDiscussions', createDiscussion)


// EVENTS routes
router.get('/events', getAllEvents)
router.post('/createEvents', createEvent)


// GROUPS routes
router.get('/groups', getAllGroups)
router.post('/createGroups', createGroup)


// NOTIFICATIONS routes
router.get('/notifications', getAllNotifications)
router.post('/createNotification', createNotification)


// PROGRESS routes
router.get('/progress', getAllProgress)
router.post('/createProgress', createProgress)


// RESOURCES routes
router.get('/resources', getAllResources)
router.post('/createResources', createResource)



module.exports = router;
