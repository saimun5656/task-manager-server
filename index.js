const express = require('express')
const cors = require('cors')
const app = express()
const port = 3000|| process.env.PORT
const multer = require('multer');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());

// Configure Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });


const uri = "mongodb+srv://task_mng-user:DnOSKKh5sXtJHipT@cluster0.xlrthmr.mongodb.net/?retryWrites=true&w=majority";


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
        // Connect the client to the server (optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        const database = client.db('TaskManagementSystem');
        const taskCollection = database.collection('TaskS');


        //all mongoDB API
        app.get('/tasks/:status', async (req, res,) => {
            const status = req.params.status
            console.log(status);
            const query = { status: status }
            const tasks = await taskCollection.find(query).toArray()
            res.send(tasks)
        })
        //status update API
        app.put('/update-status/:taskId', async (req, res) => {
            const { taskId } = req.params;
            const { newStatus } = req.body;
            const result = await taskCollection.updateOne(
                { _id: new ObjectId(taskId) },
                { $set: { status: newStatus } }
            );
            res.send(result)
        })

        // Endpoint for uploading attachments to a task's attachments array
        app.post('/upload/:taskId', upload.single('attachment'), async (req, res) => {
            const attachmentFile = req.file.buffer;
            const attachmentId = new ObjectId().toString();
            const attachmentFileName = req.file.originalname;
            const taskId = req.params.taskId;
            const attachment = {
                attachmentId, attachmentFile,
                attachmentFileName
            };
            const result = await taskCollection.updateOne(
                { _id: new ObjectId(taskId) },
                { $push: { attachments: attachment } }
            );
            console.log(result);
            res.send(result);
        })
        //Download attacments
        app.get('/download-attachment/:taskId/:attachmentId', async (req, res) => {
            const { taskId, attachmentId } = req.params;
            const task = await taskCollection.findOne({ _id: new ObjectId(taskId) });
            const attachment = task.attachments.find(a => a.attachmentId === attachmentId);
            if (!attachment) {
                res.status(404).send('Attachment not found');
                return;
            }
            res.set({
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${attachment.attachmentFileName}"`,
              });
            res.send(attachment.attachmentFile);
        })
    }


    finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!rt')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})