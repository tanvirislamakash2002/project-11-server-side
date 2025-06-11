const express = require('express');
require('dotenv').config()
const cors = require('cors')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 3000
const app = express()

// middleware
app.use(cors())
app.use(express.json())

const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const database = client.db('ph-a11-article')
        const articlesCollection = database.collection('articles-collection')
        const commentsCollection = database.collection('comments-collection')

        app.get('/recent-articles', async(req, res)=>{
            try{
                const query  = await articlesCollection.find().sort({_id:-1}).limit(6).toArray()
                res.send(query)
            }
            catch(error){
                console.log(error)
            }
        })

        app.post('/post-article', async (req, res) => {
            const articleData = req.body;
            const result = await articlesCollection.insertOne(articleData)
            res.send(result)
        })

        app.get('/all-articles', async (req, res) => {
            const allArticles = await articlesCollection.find().toArray()
            // console.log(allArticles)
            res.send(allArticles)
        })

        app.get('/all-articles/:id', async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) }
            const article = await articlesCollection.findOne(query)
            console.log(article)
            res.send(article)
        })

        app.get('/my-articles/:email', async (req, res) => {
            const { email } = req.params;
            const query = { authorEmail: email }
            const article = await articlesCollection.find(query).toArray()
            console.log(article)
            res.send(article)
        })

        app.get('/filter-by-category/:category', async (req, res) => {
            const  {category}  = req.params;
            const query = { category }
            const article = await articlesCollection.find(query).toArray()
            res.send(article)
        })

        // delete and update my article
        app.delete('/dlt-my-article/:id', async (req, res) => {
            const { id } = req.params
            const query = { _id: new ObjectId(id) }
            const result = await articlesCollection.deleteOne(query)
            res.send(result)
        })

        app.put('/edit-my-article/:id', async (req, res) => {
            const { id } = req.params
            const query = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateData = req.body;
            const updateDoc = {
                $set: updateData
            }
            const result = await articlesCollection.updateOne(query, updateDoc, options)
            res.send(result)
            // res.send(updateData)
            // console.log(updateData)
        })

        // like method
        app.patch('/like/:id', async (req, res) => {
            const id = req.params.id
            const { authorEmail } = req.body
            const query = { _id: new ObjectId(id) }
            const article = await articlesCollection.findOne(query)
            // console.log(id, authorEmail, article)
            const alreadyLiked = article?.likedBy?.includes(authorEmail)
            const updateDoc = alreadyLiked ? {
                $pull: {
                    likedBy: authorEmail
                }
            } : {
                $addToSet: {
                    likedBy: authorEmail
                }
            }
            const result = await articlesCollection.updateOne(query, updateDoc)
            res.send({
                message: alreadyLiked ? 'Dislike Successful' : 'Like Successful',
                liked: !alreadyLiked
            })
        })

        // comment management starts here 
        app.post('/comment-article', async (req, res) => {
            const commentData = req.body;
            const result = await commentsCollection.insertOne(commentData)
            res.send(result)
        })
            app.get('/article-comments/:id', async (req, res) => {
            const { id } = req.params;
            const query = { article_id: id }
            const comments = await commentsCollection.find(query).toArray()
            console.log(comments)
            res.send(comments)
        })

        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('a new era of knowledge begun')
})

app.listen(port, () => {
    console.log('server in on the go')
})
