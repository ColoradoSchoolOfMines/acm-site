const express = require("express");
const router = express.Router();
const db = require("../database/db");
const { isAdminAuthenticated, upload, fallible } = require("../middleware");
const uuid = require("uuid");

router.get(
  "/admin",
  isAdminAuthenticated,
  fallible(async (req, res) => {
    let meetingsResp = await db.query(
      "SELECT * FROM meetings ORDER BY date DESC",
    );
    for (let meeting of meetingsResp.rows) {
      const attendanceResp = await db.query(
        "SELECT attendance.user_id FROM meetings JOIN attendance ON meetings.id = attendance.meeting_id WHERE meetings.id = $1",
        [meeting.id],
      );
      meeting.attendance = attendanceResp.rows;

      const rsvpResp = await db.query(
        "SELECT COUNT(*) FROM rsvps JOIN meetings ON meetings.id = rsvps.meeting_id WHERE meetings.id = $1",
        [meeting.id],
      );
      meeting.rsvps = rsvpResp.rows[0].count;
    }

    const officersResp = await db.query(
      "SELECT * FROM users WHERE title != ''",
    );
    const feedbackResp = await db.query("SELECT * FROM feedback");
    res.render("admin", {
      title: "Admin",
      meetings: meetingsResp.rows,
      officers: officersResp.rows,
      feedbackData: feedbackResp.rows,
    });
  }),
);

router.post(
  "/admin",
  isAdminAuthenticated,
  upload("image"),
  fallible(async (req, res) => {
    const image = {};
    if (req.file) {
      image.id = req.file.filename;
    } else {
      throw new TypeError("Invalid image file");
    }

    if (typeof req.body.caption === "string" && req.body.caption.length > 0) {
      image.caption = req.body.caption;
    } else {
      throw new TypeError("Invalid image caption");
    }

    await db.query("INSERT INTO images VALUES ($1, $2)", [
      image.id,
      image.caption,
    ]);
    req.flash("success", "Successfully uploaded image!");
    res.redirect("/admin");
  }),
);

router.post(
  "/officers",
  isAdminAuthenticated,
  fallible(async (req, res) => {
    const user = {};
    if (typeof req.body.user_id === "string" && req.body.user_id.length > 0) {
      user.id = req.body.user_id;
    } else {
      throw new TypeError("Invalid user id");
    }

    if (typeof req.body.title === "string" && req.body.title.length > 0) {
      user.title = req.body.title;
    } else {
      throw new TypeError("Invalid title");
    }

    const userResp = await db.query("SELECT 1 FROM users WHERE id = $1", [
      user.id,
    ]);
    if (userResp.rows.length > 0) {
      await db.query("UPDATE users SET title = $1 WHERE id = $2", [
        user.title,
        user.id,
      ]);
      req.flash(
        "success",
        "Successfully set officer role to " +
          user.title +
          " for " +
          user.id +
          ".",
      );
      res.redirect("/admin");
    } else {
      req.flash("error", "There is not a user to modify!");
      res.redirect("/admin");
    }
  }),
);

router.post(
  "/officers/remove",
  isAdminAuthenticated,
  fallible(async (req, res) => {
    if (typeof req.body.user_id !== "string" || req.body.user_id.length < 1) {
      throw new TypeError("Invalid user id");
    }
    const userId = req.body.user_id;

    await db.query("UPDATE users SET title = $1 WHERE id = $2", ["", userId]);
    req.flash("success", "Successfully removed " + userId + " as an officer.");
    res.redirect("/admin");
  }),
);

router.post(
  "/feedback/remove",
  isAdminAuthenticated,
  fallible(async (req, res) => {
    const feedback = {};

    if (
      typeof req.body.meeting_id === "string" &&
      req.body.meeting_id.length > 0
    ) {
      feedback.meeting_id = req.body.meeting_id;
    } else {
      throw new TypeError("Invalid feedback meeting id");
    }

    if (typeof req.body.user_id === "string" && req.body.user_id.length > 0) {
      feedback.user_id = req.body.user_id;
    } else {
      throw new TypeError("Invalid feedback user id");
    }

    await db.query(
      "DELETE FROM feedback WHERE meeting_id = $1 and user_id = $2",
      [feedback.meeting_id, feedback.user_id],
    );
    req.flash(
      "success",
      "Successfully removed feedback from " + feedback.user_id + ".",
    );
    res.redirect("/admin");
  }),
);

const parseMeetingInfo = (body) => {
  const meeting = {};

  if (typeof body.title === "string" && body.title.length > 0) {
    meeting.title = body.title;
  } else {
    throw new TypeError("Invalid meeting title");
  }

  if (typeof body.description === "string" && body.description.length > 0) {
    meeting.description = body.description;
  } else {
    throw new TypeError("Invalid meeting description");
  }

  // Ensure that the meeting date is actually a valid timestamp. Date only indicates this
  // by having a NaN time (which is really hard to accurately check), or having a string
  // representation of "Invalid date". Do the latter since it's less of a footgun.
  if (
    typeof body.date === "string" &&
    new Date(body.date).toString() !== "Invalid Date"
  ) {
    meeting.date = body.date;
  } else {
    throw new TypeError("Invalid meeting date");
  }

  // parseInt returns NaN on invalid input, which should then fail the range comparison
  // since any comparison w/NaN is false.
  const duration = parseInt(body.duration);
  if (duration >= 0 && body.duration <= 10) {
    // convert hours -> milliseconds
    meeting.duration = body.duration * 60 * 60 * 1000;
  } else {
    throw new TypeError("Invalid meeting duration");
  }

  if (typeof body.location === "string" && body.location.length > 0) {
    meeting.location = body.location;
  } else {
    throw new TypeError("Invalid meeting location");
  }

  if (typeof body.type === "string" && body.type.length > 0) {
    meeting.type = body.type;
  } else {
    throw new TypeError("Invalid meeting type");
  }

  return meeting;
};

router.post(
  "/meetings",
  isAdminAuthenticated,
  fallible(async (req, res) => {
    const meeting = parseMeetingInfo(req.body);
    meeting.id = uuid.v4();

    await db.query("INSERT INTO meetings VALUES ($1, $2, $3, $4, $5, $6, $7)", [
      meeting.id,
      meeting.title,
      meeting.description,
      meeting.date,
      meeting.duration,
      meeting.location,
      meeting.type,
    ]);

    res.redirect("/admin");
  }),
);

router.post(
  "/meetings/edit",
  isAdminAuthenticated,
  fallible(async (req, res) => {
    const meeting = parseMeetingInfo(req.body);
    if (uuid.validate(req.body.meeting_id)) {
      meeting.id = req.body.meeting_id;
    } else {
      throw new TypeError("Invalid meeting id");
    }

    await db.query(
      "UPDATE meetings SET title = $1, description = $2, date = $3, duration = $4, location = $5, type = $6 WHERE id = $7",
      [
        meeting.title,
        meeting.description,
        meeting.date,
        meeting.duration,
        meeting.location,
        meeting.type,
        meeting.id,
      ],
    );

    res.redirect("/admin");
  }),
);

module.exports = router;
