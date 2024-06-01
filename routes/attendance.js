const express = require("express");
const router = express.Router();
const db = require("../database/db");
const uuid = require("uuid");
const { fallible } = require("../middleware");

const parseAttendanceForm = (req) => {
  let form = {};

  if (uuid.validate(req.body.meeting_id)) {
    form.meeting_id = req.body.meeting_id;
  } else {
    throw new TypeError("Invalid meeting id");
  }

  if (req.user) {
    // User is already logged in
    form.user_id = req.user.id;
    form.user_name = req.user.name;
  } else {
    // User is submitting w/form data
    if (typeof req.body.user_id === "string" && req.body.user_id.length > 0) {
      form.user_id = req.body.user_id;
    } else {
      throw new TypeError("Invalid user id");
    }

    if (typeof req.body.name === "string" && req.body.name.length > 0) {
      form.user_name = req.body.name;
    } else {
      throw new TypeError("Invalid user name");
    }
  }

  return form;
};

router.get(
  "/rsvp",
  fallible(async (req, res) => {
    // Find next meeting and show it to user
    const meetingResp = await db.query(
      "SELECT * FROM meetings WHERE date >= NOW() ORDER BY date LIMIT 1",
    );
    const meeting = meetingResp.rows[0];

    let rsvped = false;
    if (meeting && req.user) {
      let rsvpResp = await db.query(
        "SELECT * FROM rsvps WHERE meeting_id = $1 AND user_id = $2",
        [meeting.id, req.user.id],
      );
      rsvped = rsvpResp.rows.length > 0;
    }

    res.render("rsvp", { title: "RSVP", meeting: meeting, rsvped: rsvped });
  }),
);

router.post(
  "/rsvp",
  fallible(async (req, res) => {
    const form = parseAttendanceForm(req);
    // Check if user has RSVP'ed already
    const rsvpResp = await db.query(
      "SELECT 1 FROM rsvps WHERE user_id = $1 AND meeting_id = $2",
      [form.user_id, form.meeting_id],
    );

    if (rsvpResp.rows.length > 0) {
      req.flash("error", "You have already RSVP'ed for this event!");
      res.redirect("/");
    } else {
      await db.query("INSERT INTO rsvps VALUES ($1, $2, $3)", [
        form.meeting_id,
        form.user_id,
        form.user_name,
      ]);

      req.flash("success", "Successfully RSVP'ed! Thanks for coming.");
      res.redirect("/");
    }
  }),
);

router.get(
  "/attend",
  fallible(async (req, res) => {
    // Find active meeting if possible (2 hour buffer) TODO there's probably a better way to do this
    const meetingResp = await db.query(
      "SELECT * FROM meetings WHERE date >= NOW() - INTERVAL '2 hours' and date <= NOW() + INTERVAL '2 hours'",
    );
    const meeting = meetingResp.rows[0];
    let rsvped = false;

    if (meeting && req.user) {
      const rsvpResp = await db.query(
        "SELECT * FROM attendance WHERE user_id = $1 AND meeting_id = $2",
        [req.user.id, meeting.id],
      );
      rsvped = rsvpResp.rows.length > 0;
    }

    res.render("attend", { title: "Attend", meeting: meeting, rsvped: rsvped });
  }),
);

router.post(
  "/attend",
  fallible(async (req, res) => {
    const form = parseAttendanceForm(req);
    // Check if submitted already
    const attendanceResp = await db.query(
      "SELECT * FROM attendance WHERE user_id = $1 AND meeting_id = $2",
      [form.user_id, form.meeting_id],
    );

    if (attendanceResp.rows.length > 0) {
      req.flash(
        "error",
        "You have already submitted an attendance form for this event!",
      );
      res.redirect("/");
    } else {
      let feedback;
      if (req.body.feedback) {
        if (
          typeof req.body.feedback === "string" &&
          req.body.feedback.length > 0
        ) {
          feedback = {
            meeting_id: form.meeting_id,
            user_id: form.user_id,
            user_name: form.user_name,
            body: req.body.feedback,
          };
        } else {
          throw new TypeError("Invalid attendance feedback");
        }
      }

      await db.transaction(async (client) => {
        await client.query(
          "INSERT INTO attendance VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
          [form.meeting_id, form.user_id, form.user_name],
        );
        if (feedback) {
          await client.query("INSERT INTO feedback VALUES ($1, $2, $3, $4)", [
            feedback.meeting_id,
            feedback.user_id,
            feedback.user_name,
            feedback.body,
          ]);
        }
      });

      req.flash(
        "success",
        "Your attendance has been logged! Thanks for coming.",
      );
      res.redirect("/");
    }
  }),
);

module.exports = router;
