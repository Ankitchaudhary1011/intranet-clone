const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const POST = mongoose.model("POST");
const USER = mongoose.model("USER");
const requireLogin = require("../middlewares/requireLogin");

// to get user profile
router.get("/user/:id", (req, res) => {
    USER.findOne({ _id: req.params.id })
        .select("-password")
        .then(user => {
            POST.find({ postedBy: req.params.id })
                .populate("postedBy", "_id")
                .then((posts) => {
                   res.json({user, posts});
                }).catch((err) =>{
                     return res.status(422).json({error: err});
                    
                });
        }).catch(err => {
            return res.status(404).json({ error: "User not found" })
        })
})

// to follow user
// Follow user
router.put("/follow", requireLogin, async (req, res) => {
  try {
    const followId = req.body.followId;

    if (!followId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (followId === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    const followedUser = await USER.findByIdAndUpdate(
      followId,
      { $addToSet: { followers: req.user._id } },
      { new: true }
    );

    if (!followedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentUser = await USER.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { following: followId } },
      { new: true }
    );

    res.json({
      message: "Followed successfully",
      user: currentUser,
      followedUser: followedUser
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

// to unfollow user
// Unfollow user
router.put("/unfollow", requireLogin, async (req, res) => {
  try {
    const followId = req.body.followId;

    await USER.findByIdAndUpdate(req.user._id, {
      $pull: { following: followId }
    });

    await USER.findByIdAndUpdate(followId, {
      $pull: { followers: req.user._id }
    });

    res.json({ message: "Unfollowed successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

// to upload profile pic
// to upload profile pic
router.put("/uploadProfilePic", requireLogin, (req, res) => {
  USER.findByIdAndUpdate(
    req.user._id,
    {
      $set: { Photo: req.body.pic }
    },
    {
      new: true
    }
  )
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      return res.status(422).json({ error: err });
    });
});

module.exports = router;