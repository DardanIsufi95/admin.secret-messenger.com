module.exports = function({
    express,
    redisClient,
    db,
    uuidv4,
    uuidValidate,
    password_hash,
    Framework
}){
    router = express.Router()
    router.get("/imported", async (req,res)=>{
        res.send(await Framework.importedProfiles())
    })
    router.get("/notimported", async (req,res)=>{
        res.send(await Framework.notImportedProfiles())
    })

    router.get("/import/:profileID", async (req,res)=>{
        console.log(req.params.profileID)
        Framework.ImportProfileAndData(req.params.profileID).then((res)=>{
            console.log("DONE")
        })
        res.send()
    })
    return router
} 