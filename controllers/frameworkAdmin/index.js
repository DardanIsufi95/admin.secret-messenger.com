module.exports = function({redisClient,apiFetch,db,helpers,moment,path}){
    const Api = require('./Api.js')({apiFetch,helpers})
    const Database = require('./Database.js')({db,helpers})



    function ImportProfile(profileID){
        return new Promise(async (resolve ,reject)=>{
            try{
                let info = await Api.getProfileInfo(profileID)
                let result = await Database.saveProfile(info)
                resolve({id:info["id"], profileName:info["profileName"] })
            }catch(err){
                reject(err)
                return
            }
            
        })
    }
    
    function ImportDialoges(profileID){
        function ImportDialoge(profileID, dialog){
            function ImportMsg(profileID,userID,data){
                return new Promise(async (resolve,reject)=>{
                    try{   
                        await Database.saveMessage(profileID,userID,data)
                        resolve(true)
                    }catch(e){
                        console.log(e)
                        if(e.code == "ER_NO_REFERENCED_ROW_2"){
                            let newUserData = await Api.getUserInfo(userID)
                            await Database.saveUser(newUserData)
                            await redisClient.hincrby(`IMPORT:QUEUE:${profileID}`, "newUsers" , 1  )
                            await ImportMsg(profileID,userID,data)
                        }else if(e.code == "ER_DUP_ENTRY"){
                            
                        
                        }else{
                            reject(e)
                        }
                    }
                    await redisClient.hincrby(`IMPORT:QUEUE:${profileID}`, "doneMessages" , 1  )
                    resolve(true)
                })
            }
            return new Promise(async (resolve,reject)=>{
                let userID = profileID == dialog[0].recipient ? dialog[0].data["sender"] : dialog[0].recipient
                try{
                    
                    let jobs = []
                    await Database.saveContactRecord(profileID,userID,"dialog")
                    dialog.forEach((msg) => {
                        let data = msg.data
                        data.sender = msg.data["sender"] == profileID ? 1 : 0
                        data.time = moment(msg["time"]).format("x")
                        data.imageName = typeof(msg["image_url"]) != "undefined" ? path.basename(msg["image_url"]) : null
                        data.attachmentID = null
                        data.attachmentUrl = null
                        if(msg["attachment"]){
                            data.attachmentID = msg["attachment"]["attachment_id"]
                            data.attachmentUrl = msg["attachment"]["attachment_url"]
                        }
                        jobs.push(ImportMsg(profileID,userID,data))
                    });
                    
                    await Promise.allSettled(jobs)
                    await redisClient.hincrby(`IMPORT:QUEUE:${profileID}`, "doneDialoges" , 1  )
                }catch(e){
                    if(e.code == "ER_NO_REFERENCED_ROW_2"){
                        let newUserData = await Api.getUserInfo(userID)
                        await Database.saveUser(newUserData)
                        await redisClient.hincrby(`IMPORT:QUEUE:${profileID}`, "newUsers" , 1  )
                        await ImportDialoge(profileID, dialog)
                    }else if(e.code == "ER_DUP_ENTRY"){
                        
                        
                    }else{
                        console.log(e)
                    }
                }
                
                resolve(true)
            })
        }
        return new Promise(async (resolve,reject)=>{
            try{

                let dialoges = await Api.getDialogsAll(profileID,1)

                let totalMessages = 0

                for (let i = 0; i < dialoges.length; i++) {
                    const dialoge = dialoges[i];
                    totalMessages += dialoge.length
                }

                await redisClient.hmset(`IMPORT:QUEUE:${profileID}`, "newUsers", 0 , "totalDialoges" , dialoges.length ,"doneDialoges" , 0 , "totalMessages", totalMessages , "doneMessages" , 0 , "errorMessages" , 0 )

                let jobs = []

                dialoges.forEach((dialoge) => {
                    jobs.push(ImportDialoge(profileID,dialoge))
                });

                await Promise.allSettled(jobs)
                
            }catch(e){
                reject(e)
                return
            }
            resolve(true)
        })
        
    }

    function ImportFavorites(profileID){

        function ImportFavorite(profileID,userID){
            return new Promise(async (resolve,reject)=>{
                try{
                    await Database.saveContactRecord(profileID,userID,"favorite")
                    resolve(true)
                }catch(err){
                    if(err.code == "ER_NO_REFERENCED_ROW_2"){
                        let newUserData = await Api.getUserInfo(userID)
                        await Database.saveUser(newUserData)
                        await redisClient.hincrby(`IMPORT:QUEUE:${profileID}`, "newUsers" , 1  )
                        await ImportFavorite(profileID,userID)
                    }else if(err.code == "ER_DUP_ENTRY"){
                        

                    }else{
                        reject(err)
                    }
                }
                resolve(true)
            })
        }

        return new Promise(async (resolve,reject)=>{
            let favorites = await Api.getFavorites(profileID)

            await redisClient.hmset(`IMPORT:QUEUE:${profileID}`, "totalFavorites" , favorites.length , "doneFavorites" , 0 , "errorFavorites" , 0 )

            let jobs = []

            favorites.forEach((userID) => {
                jobs.push(ImportFavorite(profileID,userID).then((result)=>{
                    if(result || true){
                        redisClient.hincrby(`IMPORT:QUEUE:${profileID}`, "doneFavorites" , 1  )
                    }
                }))
            });

            await Promise.allSettled(jobs)
            resolve()
        })
    }

    function ImportNotes(profileID){
        function ImportNote(profileID,note){
            return new Promise(async (resolve,reject)=>{
                try{
                    await Database.saveNote(profileID,note)
                    resolve(true)
                }catch(err){
                    if(err.code == "ER_NO_REFERENCED_ROW_2"){
                        let newUserData = await Api.getUserInfo(note.user)
                        await Database.saveUser(newUserData)
                        await ImportNote(profileID,note)
                    }else if(err.code == "ER_DUP_ENTRY"){
                        
                    }else{
                        reject(err)
                    }
                }
                resolve(true)
            })
        }
        return new Promise(async (resolve,reject)=>{
            try{
                let notes = await Api.getNotes(profileID)

                await redisClient.hmset(`IMPORT:QUEUE:${profileID}`, "totalNotes" , notes.length , "doneNotes" , 0 , "errorNotes" , 0 )

                let jobs = []

                notes.forEach((note) => {
                    jobs.push(ImportNote(profileID,note).then((result)=>{
                        if(result || true){
                            redisClient.hincrby(`IMPORT:QUEUE:${profileID}`, "doneNotes" , 1  )
                        }
                    }))
                });

                await Promise.allSettled(jobs)
                resolve(true)
            }catch(e){
                reject(e)
            }
            
        })
    }
    class Framework{

        static notImportedProfiles(){
            return new Promise(async (resolve,reject)=>{
                try{
                    let allProfiles = await Api.getAllProfiles()
                    let savedProfilesData = await Database.getAllProfiles()
                    let savedProfiles = []
                    for (let i = 0; i < savedProfilesData.length; i++) {
                        const profile = savedProfilesData[i]
                        savedProfiles.push(profile["id"])
                    }
                    let newProfiles = []
                    let jobs = []
                    for (let i = 0; i < allProfiles.length; i++) {
                        const profileID = allProfiles[i]
                        if(!savedProfiles.includes(profileID)){
                            newProfiles.push(profileID)
                            jobs.push( Api.getProfileInfo(profileID) )
                        }
                    }
                    let results = await Promise.all(jobs)
                    let data = []
                    for (let i = 0; i < results.length; i++) {
                        const result = results[i];
                        data.push({
                            id: result["id"],
                            profileName: result["profileName"]
                        })
                    }
                    resolve(data)
                }catch(err){
                    reject(err)
                }
            })
        }
        static importedProfiles(){
            return new Promise(async (resolve,reject)=>{
                try{
                    let savedProfilesData = await Database.getAllProfiles()
                    let savedProfiles = []
                    for (let i = 0; i < savedProfilesData.length; i++) {
                        const profile = savedProfilesData[i]
                        savedProfiles.push({
                            id:profile["id"],
                            profileName:profile["profileName"],
                            importTimestamp: moment(profile["importTimestamp"]).format("DD-MMM-YYYY HH:mm")
                        })
                    }
                    resolve(savedProfiles)
                }catch(err){
                    reject(err)
                }
            })
        }
        
        static getQueueStatus(){
            return new Promise(async (resolve,reject)=>{
                let importqueues = await redisClient.keys("IMPORT:QUEUE:*")
                let data = []
                let jobs = []

                importqueues.forEach((importqueue)=>{
                    jobs.push(new Promise(async (resolve,reject)=>{
                        let sub = 
                        data.push(await redisClient.hgetall(importqueue))
                        resolve()
                    }))
                })

                await Promise.allSettled(jobs)

                resolve(data)
            })
        }


        static ImportProfileAndData(profileID){

            return new Promise(async (resolve,reject)=>{
                let allProfiles = await Api.getAllProfiles()

                if(!allProfiles.includes(profileID)){
                    reject(false)
                }

                
                let info = await ImportProfile(profileID)
                await redisClient.del(`IMPORT:QUEUE:${profileID}`)
                await redisClient.hmset(`IMPORT:QUEUE:${profileID}`, "running" , 1 , "id",info["id"] , "profileName", info["profileName"] )

                let jobs = [
                    ImportFavorites(profileID),
                    ImportNotes(profileID),
                    ImportDialoges(profileID)
                ]

                await Promise.all(jobs)


                resolve()




            })
        }





        
    }
    return Framework
}


