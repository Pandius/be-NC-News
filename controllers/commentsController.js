const {postComment, fetchComments} = require('../models/commentsModel');

exports.sendPostComment = (req, res, next) => {
  const {article_id} = req.params;
  const {body} = req;
  postComment(article_id, body)
    .then(comment => {
      res.status(201).send({comment});
    })
    .catch(next);
};

exports.sendAllComments = (req, res, next) => {
  const {article_id} = req.params;

  fetchComments(article_id)
    .then(comments => {
      res.status(200).send({comments});
    })
    .catch(next);
};