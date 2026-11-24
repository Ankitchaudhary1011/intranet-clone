const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const requireLogin = require("../middlewares/requireLogin");
const { route } = require("./auth");
const POST = mongoose.model("POST")


// Route
router.get("/allposts", requireLogin, (req, res) => {
    POST.find()
        .populate("postedBy", "_id name Photo")
        .populate("comments.postedBy", "_id name")
        .sort("-createdAt")
        .then(posts => res.json(posts))
        .catch(err => console.log(err))
})

router.post("/createPost", requireLogin, (req, res) => {
    const { body, pic } = req.body;
    console.log(pic)
    if (!body || !pic) {
        return res.status(422).json({ error: "Please add all the fields" })
    }
    console.log(req.user)
    const post = new POST({
        body,
        photo: pic,
        postedBy: req.user
    })
    post.save().then((result) => {
        return res.json({ post: result })
    }).catch(err => console.log(err))
})

router.get("/myposts", requireLogin, (req, res) => {
    POST.find({ postedBy: req.user._id })
        .populate("postedBy", "_id name")
        .populate("comments.postedBy", "_id name")
        .sort("-createdAt")
        .then(myposts => {
            res.json(myposts)
        })
})

router.put("/like", requireLogin, (req, res) => {
    POST.findByIdAndUpdate(req.body.postId, {
        $push: { likes: req.user._id }
    }, {
        returnDocument: 'after'
    })
        .then((result)=>{
            res.json(result)
        })
        .catch((error)=>{
            return res.status(422).json({error:err})
        })
})

router.put("/unlike", requireLogin, (req, res) => {
    POST.findByIdAndUpdate(req.body.postId, {
        $pull: { likes: req.user._id }
    }, {
         returnDocument: 'after'
    }).populate("postedBy", "_id name Photo")
        .then(result => {
            res.json(result)
        })
        .catch(err =>{
            return res.status(422).json({error:err})
        })
})

// API to delete comment
router.delete("/deleteComment/:postId/:commentId", requireLogin, async (req, res) => {
    try {
        const post = await POST.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const comment = post.comments.id(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        if (comment.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                error: "You are not authorized to delete this comment"
            });
        }

        post.comments.pull(req.params.commentId);

        await post.save();

        await post.populate("comments.postedBy", "_id name");

        return res.json({
            message: "Comment deleted successfully",
            post: post
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
});

router.put("/comment", requireLogin, (req, res) => {
    const comment = {
        comment: req.body.text,
        postedBy: req.user._id
    }
    POST.findByIdAndUpdate(req.body.postId, {
        $push: { comments: comment }
    }, {
        returnDocument: 'after'
    })
        .populate("comments.postedBy", "_id name")
        .populate("postedBy", "_id name Photo")
        .then( result => {
            res.json(result)
        })
        .catch(err =>{
            return res,statues(422).json({error:err})
        })
})

// Api to delete post
router.delete("/deletePost/:postId", requireLogin, (req, res) => {
    POST.findOne({ _id: req.params.postId })
        .populate("postedBy", "_id")
        .then( post => {
            if (!post) {
                return res.status(422).json({ error: "Post not found"})
            }

            if (post.postedBy._id.toString() == req.user._id.toString()) {

                post.deleteOne()
                    .then(result => {
                        return res.json({ message: "Successfully deleted" })
                    }).catch((err) => {
                        console.log(err)
                    })
            }
        })
        .catch(err => {
            return res.status(422).json({error:err})
        })
})

// to show following post
router.get("/myfollwingpost", requireLogin, (req, res) => {
    POST.find({ postedBy: { $in: req.user.following } })
        .populate("postedBy", "_id name")
        .populate("comments.postedBy", "_id name")
        .then(posts => {
            res.json(posts)
        })
        .catch(err => { console.log(err) })
})

module.exports = router