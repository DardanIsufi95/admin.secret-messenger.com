module.exports = function({
    express,
    redisClient,
    db,
    uuidv4,
    uuidValidate,
    password_hash
}){
    router = express.Router()
    router.use(async function(req,res,next){

        if(typeof(req.cookies.id) == "undefined" || req.cookies.id == "" || !uuidValidate(req.cookies.id || "")){

            res.cookie('id',uuidv4(),{
                maxAge: 30*24*60*60
            })
            res.render("login")
           
            return
        }

        if(req.method == "POST" && typeof(req.body.username) != "undefined" && typeof(req.body.password) != "undefined" ){

            let rows , fields ;

            try{
                [rows , fields] = await db.execute(`SELECT * from adminuser WHERE username='${req.body.username}' AND isActive = 1`)
            }catch(e){
                errorHandler(e)
                res.send("ERROR")
                return
            }

            if(rows.length == 0){
                res.render("login")
                return
            }

            let verified = password_hash(req.body.password).verify(rows[0]['password'])

            if(!verified){
                res.render("login")
                return
            }

            try{
                await redisClient.hmset(`ADMINSESSION:${req.cookies.id}` , "id", rows[0]['id'] , "username", rows[0]['username'] , "name" ,  rows[0]['name']  )
                redisClient.expire(`ADMINSESSION:${req.cookies.id}`,30*60)
            }catch(e){
                errorHandler(e)
                res.send("ERROR")
                return
            }
            

            res.redirect("/")
            return
        }


        let session = await redisClient.hgetall(`ADMINSESSION:${req.cookies.id}`)
        if(session == null){
            res.render("login")
            return
        }
        redisClient.expire(`ADMINSESSION:${req.cookies.id}`,30*60)
        next()
    })
    router.get('/logout', async (req,res)=>{
        try{
            await redisClient.del(`ADMINSESSION:${req.cookies.id}`)
            res.redirect("/")
        }catch(e){
            errorHandler(e)
            res.send("ERROR")
            return
        }
    })
    return router
} 