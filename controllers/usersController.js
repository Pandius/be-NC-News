const {fetchUserByUsername} = require('../models/usersModel');

exports.sendUserByUsername = (req, res, next) => {
  const {username} = req.params;
  fetchUserByUsername(username)
    .then(user => {
      res.status(200).send({user});
    })
    .catch(next);
};
