process.env.NODE_ENV = 'test';
const connection = require('../db/connection');
const chai = require('chai');
const {expect} = chai;
const chaiSorted = require('chai-sorted');
const app = require('../app.js');
const request = require('supertest');
chai.use(chaiSorted);

describe('/*', () => {
  after(() => connection.destroy());
  beforeEach(() => connection.seed.run());
  it('GET status 404, responds with the message Page not found for wrong address', () => {
    return request(app)
      .get('/wrongaddress')
      .expect(404)
      .then(({body}) => {
        expect(body.msg).to.equal('Page not found');
      });
  });
  describe('/api', () => {
    it('Method not allowed: status 405 for /topics', () => {
      const invalidMethods = ['patch', 'put', 'post', 'del'];
      const methodPromises = invalidMethods.map(method => {
        return request(app)
          [method]('/api')
          .expect(405)
          .then(({body}) => {
            expect(body.msg).to.equal('Method not allowed');
          });
      });
      return Promise.all(methodPromises);
    });
    it('GET status 200, returns a JSON file of all endpoints', () => {
      return request(app)
        .get('/api')
        .expect(200)
        .then(({body}) => {
          expect(body).to.be.an('object');
        });
    });
    describe('/topics', () => {
      it('GET status 200, returns an array of topics objects', () => {
        return request(app)
          .get('/api/topics')
          .expect(200)
          .then(({body}) => {
            expect(body.topics).to.be.an('Array');
            expect(body.topics[0]).to.have.keys('slug', 'description');
          });
      });
      it('Method not allowed: status 405 for /topics', () => {
        const invalidMethods = ['patch', 'put', 'post', 'delete'];
        const methodPromises = invalidMethods.map(method => {
          return request(app)
            [method]('/api/topics')
            .expect(405)
            .then(({body}) => {
              expect(body.msg).to.equal('Method not allowed');
            });
        });
        return Promise.all(methodPromises);
      });
    });
    describe('/users', () => {
      describe('/users/:username', () => {
        it(' GET status 200, returns an user by his username', () => {
          return request(app)
            .get('/api/users/butter_bridge')
            .expect(200)
            .then(({body}) => {
              expect(body.user.username).to.be.equal('butter_bridge');
              expect(body.user).to.have.keys('username', 'avatar_url', 'name');
            });
        });
        it('Method not allowed: status 405 for /users/:username', () => {
          const invalidMethods = ['patch', 'put', 'post', 'delete'];
          const methodPromises = invalidMethods.map(method => {
            return request(app)
              [method]('/api/users/rogersop')
              .expect(405)
              .then(({body}) => {
                expect(body.msg).to.equal('Method not allowed');
              });
          });
          return Promise.all(methodPromises);
        });
        it(' GET status 404, for valid but non existing user', () => {
          return request(app)
            .get('/api/users/no-user-name')
            .expect(404)
            .then(({body}) => {
              expect(body.msg).to.be.equal('user doesnt exists');
            });
        });
        it(' GET status 400, for invalid username', () => {
          return request(app)
            .get('/api/users/99909')
            .expect(400)
            .then(({body}) => {
              expect(body.msg).to.be.equal('Bad request');
            });
        });
      });
    });
    describe('/articles', () => {
      it('GET: status 200, gets all articles, sorting them by date and in descending order by default', () => {
        return request(app)
          .get('/api/articles')
          .expect(200)
          .then(({body}) => {
            expect(body.articles).to.be.an('array');
            expect(body.articles[0]).to.contain.keys(
              'article_id',
              'title',
              'comment_count',
              'votes',
              'topic',
              'author',
              'created_at'
            );
            expect(body.articles).to.be.descendingBy('created_at');
          });
      });
      it('GET status 200, gets all articles, sorted when provided sort method by query', () => {
        return request(app)
          .get('/api/articles?sort_by=title')
          .expect(200)
          .then(({body}) => {
            expect(body.articles).to.be.descendingBy('title');
          });
      });
      it('Method not allowed: status 405 for /articles', () => {
        const invalidMethods = ['patch', 'put', 'post', 'delete'];
        const methodPromises = invalidMethods.map(method => {
          return request(app)
            [method]('/api/articles')
            .expect(405)
            .then(({body}) => {
              expect(body.msg).to.equal('Method not allowed');
            });
        });
        return Promise.all(methodPromises);
      });
      it('GET status 200, respond with array of article objects, with queries like- sort by created_at-ascending and filtered by author', () => {
        return request(app)
          .get(
            '/api/articles?sort_by=created_at&order=asc&author=icellusedkars'
          )
          .expect(200)
          .then(res => {
            expect(res.body.articles).to.be.an('array');
            expect(res.body.articles[0].author).to.equal('icellusedkars');
            expect(res.body.articles[1].author).to.equal('icellusedkars');
            expect(res.body.articles[2].author).to.equal('icellusedkars');
            expect(res.body.articles).to.be.ascendingBy('created_at');
          });
      });
      it('GET status 200, respond with array of article objects, accept queries sort by body-descending, filter by topic', () => {
        return request(app)
          .get('/api/articles?sort_by=created_at&order=desc&topic=mitch')
          .expect(200)
          .then(res => {
            expect(res.body.articles).to.be.an('array');
            expect(res.body.articles[0].topic).to.equal('mitch');
            expect(res.body.articles[1].topic).to.equal('mitch');
            expect(res.body.articles[2].topic).to.equal('mitch');
            expect(res.body.articles).to.be.descendingBy('created_at');
          });
      });
      it('GET status 200, gets all articles, sorted in ascending order when provided that query', () => {
        return request(app)
          .get('/api/articles?order=asc')
          .expect(200)
          .then(({body}) => {
            expect(body.articles).to.be.ascendingBy('created_at');
          });
      });
      it('GET status 200, responds with all articles, filtered by  author', () => {
        return request(app)
          .get('/api/articles?author=butter_bridge')
          .expect(200)
          .then(({body}) => {
            expect(body.articles).to.be.descendingBy('author');
          });
      });
      it('GET status 404, when passing valid id, but doesnt exist in database', () => {
        return request(app)
          .get('/api/articles/12345678')
          .expect(404)
          .then(({body}) => {
            expect(body.msg).to.equal('article not found');
          });
      });
      it('GET status 400 - bad request, when passing invalid id, ie string', () => {
        return request(app)
          .get('/api/articles/not-a-valid-id')
          .expect(400)
          .then(({body}) => {
            expect(body.msg).to.equal('Invalid article id');
          });
      });
      it('GET status 400, gets an error if invalid sort_by value', () => {
        return request(app)
          .get('/api/articles?sort_by=not-a-column')
          .expect(400)
          .then(({body}) => {
            console.log(body);
            expect(body.msg).to.equal('invalid sort by value');
          });
      });
      it('GET status 404, gets an error if  invalid author', () => {
        return request(app)
          .get('/api/articles?author=no-one')
          .expect(404)
          .then(({body}) => {
            expect(body.msg).to.equal('Author not found');
          });
      });
      it('GET status 404, gets an error if  invalid topic', () => {
        return request(app)
          .get('/api/articles?topic=nothing')
          .expect(404)
          .then(({body}) => {
            expect(body.msg).to.equal('Topic not found');
          });
      });
      it('GET status 400, gets an error with an invalid sort_by value', () => {
        return request(app)
          .get('/api/articles?order=invalid-order')
          .expect(400)
          .then(({body}) => {
            expect(body.msg).to.equal('invalid order value');
          });
      });
      describe('/articles/articles_id', () => {
        it('GET status 200, returns an article by article id', () => {
          return request(app)
            .get('/api/articles/1')
            .expect(200)
            .then(({body}) => {
              expect(body.article).to.have.keys(
                'article_id',
                'title',
                'body',
                'votes',
                'topic',
                'author',
                'created_at',
                'comment_count'
              );
            });
        });
        it('Method not allowed: status 405 for /articles/:article_id', () => {
          const invalidMethods = ['put', 'post', 'delete'];
          const methodPromises = invalidMethods.map(method => {
            return request(app)
              [method]('/api/articles/1')
              .expect(405)
              .then(({body}) => {
                expect(body.msg).to.equal('Method not allowed');
              });
          });
          return Promise.all(methodPromises);
        });
        it('GET status 400, for not valid article id, returns an err message', () => {
          return request(app)
            .get('/api/articles/string')
            .expect(400)
            .then(({body}) => {
              expect(body.msg).to.equal('Invalid article id');
            });
        });
        it('GET status 400, for non existing valid article id, returns an err message', () => {
          return request(app)
            .get('/api/articles/99999')
            .expect(404)
            .then(({body}) => {
              expect(body.msg).to.equal('article not found');
            });
        });
        it('PATCH status 200, returns an updated article', () => {
          return request(app)
            .patch('/api/articles/2')
            .send({inc_votes: 1})
            .expect(200)
            .then(({body}) => {
              expect(body.article).to.contain.keys(
                'article_id',
                'title',
                'body',
                'votes',
                'topic',
                'author',
                'created_at'
              );
              expect(body.article.votes).to.equal(1);
            });
        });
        it('PATCH status 404, patching article with valid id  that doesnt exists', () => {
          return request(app)
            .patch('/api/articles/12345667')
            .send({inc_votes: 10})
            .expect(404)
            .then(({body}) => {
              expect(body.msg).to.equal('article not found');
            });
        });
        it('PATCH status 400 responds with status code 400, when passed an article_id in an invalid format', () => {
          return request(app)
            .patch('/api/articles/notanarticle')
            .send({
              inc_votes: 12
            })
            .expect(400)
            .then(({body}) => {
              expect(body.msg).to.equal('Invalid article id');
            });
        });
        it('PATCH responds with status code 400, when passed a vote object in an invalid format', () => {
          return request(app)
            .patch('/api/articles/1')
            .send({
              inc_votes: 'not a number'
            })
            .expect(400)
            .then(({body}) => {
              expect(body.msg).to.equal('Invalid article id');
            });
        });
        it('PATCH restponds with code 200, ignores any extra item passed in the body', () => {
          return request(app)
            .patch('/api/articles/1')
            .send({inc_votes: -40, pet: 'cat'})
            .expect(200)
            .then(({body}) => {
              expect(body.article.votes).to.equal(60);
            });
        });
        it('PATCH responds with status code 200 and returns an unchanged article, when passed a vote object with an invalid key', () => {
          return request(app)
            .patch('/api/articles/1')
            .send({
              some_key: 666
            })
            .expect(200)
            .then(({body}) => {
              expect(body.article.votes).to.eql(100);
            });
        });
        it('GET status 200, responds with array of all comments for article by id sorted by created_at by default', () => {
          return request(app)
            .get('/api/articles/1/comments')
            .expect(200)
            .then(({body}) => {
              expect(body.comments).to.be.an('array');
              expect(body.comments[0]).to.contain.keys(
                'comment_id',
                'body',
                'article_id',
                'author',
                'votes',
                'created_at'
              );
              expect(body.comments.length).to.equal(13);
              expect(body.comments).to.be.descendingBy('created_at');
            });
        });

        it('GET: status 200, returns an empty array if an article containing no comments is entered', () => {
          return request(app)
            .get('/api/articles/2/comments')
            .expect(200)
            .then(({body}) => {
              console.log(body);
              expect(body.comments).to.eql([]);
            });
        });
        it('GET: status 404, returns an error if a non-existent article is entered', () => {
          return request(app)
            .get('/api/articles/99/comments')
            .expect(404)
            .then(({body}) => {
              expect(body.msg).to.equal('comments not found');
            });
        });
        it('GET: status 400, returns an error if an invalid article is entered', () => {
          return request(app)
            .get('/api/articles/invalid/comments')
            .expect(400)
            .then(({body}) => {
              expect(body.msg).to.equal(
                'Bad request - Article ID must be an integer'
              );
            });
        });
        it('GET: status 200, displays all comments for specified article, sorting comments by the specified sort_by query when provided with a valid query', () => {
          return request(app)
            .get('/api/articles/1/comments?sort_by=author')
            .expect(200)
            .then(({body}) => {
              expect(body.comments[0].author).to.equal('icellusedkars');
            });
        });
        it('GET: status 200, displays all comments for specified article, sorting comments in the specified order when provided with a valid query', () => {
          return request(app)
            .get('/api/articles/1/comments?order=asc')
            .expect(200)
            .then(({body}) => {
              expect(body.comments).to.be.ascendingBy('created_at');
            });
        });
        it('GET: status 200, displays all comments for specified article, sorting comments by the specified column and in the specified order when provided with a valid query', () => {
          return request(app)
            .get('/api/articles/1/comments?sort_by=votes&order=asc')
            .expect(200)
            .then(({body}) => {
              expect(body.comments).to.be.ascendingBy('votes');
            });
        });
        it('POST status 201, returns an posted comment', () => {
          return request(app)
            .post('/api/articles/2/comments')
            .send({
              username: 'lurker',
              body: 'this is new comment'
            })
            .expect(201)
            .then(({body}) => {
              expect(body.comment.comment_id).to.equal(19);
              expect(body.comment.author).to.equal('lurker');
              expect(body.comment.article_id).to.equal(2);
              expect(body.comment.votes).to.equal(0);
              expect(body.comment.body).to.equal('this is new comment');
            });
        });
        it('POST status 400, empty object - nothing to post', () => {
          return request(app)
            .post('/api/articles/1/comments')
            .send({})
            .expect(400)
            .then(({body}) => {
              expect(body.msg).to.equal('No data to post!');
            });
        });
        it('POST status 400, invalid username and nothing to post', () => {
          return request(app)
            .post('/api/articles/1/comments')
            .send({username: 'invalidUsername'})
            .expect(400)
            .then(({body}) => {
              expect(body.msg).to.equal('No data to post!');
            });
        });
        it('POST status 400, invalid username but comment to post', () => {
          return request(app)
            .post('/api/articles/1/comments')
            .send({username: 'invalidUsername', body: 'comment'})
            .expect(404)
            .then(({body}) => {
              expect(body.msg).to.equal('Not found');
            });
        });
        it('POST status 400, valid username but nothing to post', () => {
          return request(app)
            .post('/api/articles/1/comments')
            .send({username: 'lurker'})
            .expect(400)
            .then(({body}) => {
              expect(body.msg).to.equal('No data to post!');
            });
        });
        it('POST status 404, returns an error if a non-existent article_id is used', () => {
          return request(app)
            .post('/api/articles/1999/comments')
            .send({
              body:
                'I have a controvertial opinion regarding the subject matter of this article',
              username: 'butter_bridge'
            })
            .expect(404)
            .then(({body}) => {
              expect(body.msg).to.equal('Not found');
            });
        });
      });
      describe('/comments', () => {
        describe('/comments/:comment_id', () => {
          it('PATCH status 200, returns updated comment', () => {
            return request(app)
              .patch('/api/comments/1')
              .send({inc_votes: 1})
              .expect(200)
              .then(({body}) => {
                expect(body.comment.votes).to.equal(17);
              });
          });
          it('Method not allowed: status 405 for /comments/comments_id', () => {
            const invalidMethods = ['get', 'put', 'post'];
            const methodPromises = invalidMethods.map(method => {
              return request(app)
                [method]('/api/comments/1')
                .expect(405)
                .then(({body}) => {
                  expect(body.msg).to.equal('Method not allowed');
                });
            });
            return Promise.all(methodPromises);
          });
          it('PATCH: 200, decrements the vote count by the stated number', () => {
            return request(app)
              .patch('/api/comments/1')
              .send({inc_votes: -2})
              .expect(200)
              .then(({body}) => {
                expect(body.comment.votes).to.equal(14);
              });
          });
          it('PATCH: status 200, ignores any additional element passed in through the body', () => {
            return request(app)
              .patch('/api/comments/1')
              .send({inc_votes: 1, pet: 'cat'})
              .expect(200)
              .then(({body}) => {
                expect(body.comment.votes).to.equal(17);
              });
          });
          it('PATCH: status 400, returns an error where no inc_votes value is provided', () => {
            return request(app)
              .patch('/api/comments/1')
              .send({})
              .expect(400)
              .then(({body}) => {
                expect(body.msg).to.equal(
                  'Bad request - votes needs to be a number'
                );
              });
          });
          it('PATCH: status 400, returns an error where an invalid inc_votes value is provided', () => {
            return request(app)
              .patch('/api/comments/1')
              .send({inc_votes: 'hello'})
              .expect(400)
              .then(({body}) => {
                expect(body.msg).to.equal(
                  'Bad request - votes needs to be a number'
                );
              });
          });
          it('PATCH: status 404, returns an error if provided a comment_id that does not exist', () => {
            return request(app)
              .patch('/api/comments/99')
              .send({inc_votes: 5})

              .expect(404)
              .then(({body}) => {
                expect(body.msg).to.equal('comment Id not found');
              });
          });
          it('DELETE status 204', () => {
            return request(app)
              .delete('/api/comments/1')
              .expect(204);
          });
          it('DELETE status 404, returns an error message if a comment_id that does not exist', () => {
            return request(app)
              .delete('/api/comments/99')
              .expect(404)
              .then(({body}) => {
                expect(body.msg).to.equal('Comment with Id 99 not found');
              });
          });
        });
      });
    });
  });
});
