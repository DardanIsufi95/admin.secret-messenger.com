module.exports = function({
    db,
    helpers,
    moment
}){
    return class Database{
        static getAllProfiles(){
            return new Promise(async (resolve,reject)=>{
                try{
                    const [rows , fields] = await db.execute("SELECT * FROM profiles WHERE imported='1' ")
                    resolve(rows)
                }catch(err){
                    reject(err)
                }
                
            })
        }
        static createContactTable(profileID){
            return new Promise(async (resolve,reject)=>{
                try{
                    await db.execute(`CREATE TABLE IF NOT EXISTS contacts_${helpers.hash10(profileID)}( 
                        profileID VARCHAR(120) NOT NULL DEFAULT '${profileID}' , 
                        userID VARCHAR(120) NOT NULL , 
                        favorite BOOLEAN NOT NULL DEFAULT FALSE , 
                        marked BOOLEAN NOT NULL DEFAULT FALSE , 
                        spam BOOLEAN NOT NULL DEFAULT FALSE , 
                        open BOOLEAN NOT NULL DEFAULT FALSE ,
                        dialog BOOLEAN NOT NULL DEFAULT FALSE ,
                        timesamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (userID),
                        FOREIGN KEY (userID) REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT,
                        FOREIGN KEY (profileID) REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE RESTRICT
                        )`
                    )
                    resolve(true)
                }catch(e){
                    reject(e)
                }
                
            })
        }
        static createNotesTable(profileID){
            return new Promise(async (resolve,reject)=>{
                try{
                    await db.execute(`CREATE TABLE IF NOT EXISTS notes_${helpers.hash10(profileID)}( 

                        profileID VARCHAR(120) NOT NULL DEFAULT '${profileID}' , 
                        userID VARCHAR(120) NOT NULL , 
                        notes_realname tinytext DEFAULT NULL,
                        notes_city tinytext DEFAULT NULL,
                        notes_zodiac tinytext DEFAULT NULL,
                        notes_work tinytext DEFAULT NULL,
                        notes_preferences tinytext DEFAULT NULL,
                        notes_antipathy tinytext DEFAULT NULL,
                        notes_fantasy tinytext DEFAULT NULL,
                        notes_family tinytext DEFAULT NULL,
                        notes_hobby tinytext DEFAULT NULL,
                        notes_comment text DEFAULT NULL,
                        timesamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (userID),
                        FOREIGN KEY (userID) REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT,
                        FOREIGN KEY (profileID) REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE RESTRICT
                        )`
                    )
                    resolve(true)
                }catch(e){
                    reject(e)
                }
                
            })
        }
        static createDialogeTable(profileID,userID){
            return new Promise(async (resolve,reject)=>{
                try{
                    await db.execute(`CREATE TABLE IF NOT EXISTS dialog_${helpers.hash10(profileID)}_${helpers.hash10(userID)}(
                            msgid VARCHAR(30) NOT NULL ,  
                            profileID VARCHAR(120) NOT NULL DEFAULT '${profileID}' ,
                            userID VARCHAR(120) NOT NULL DEFAULT '${userID}', 
                            timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ,
                            sender BOOLEAN NOT NULL , 
                            type VARCHAR(80) NOT NULL ,
                            text TEXT NULL ,  
                            imageUrl TINYTEXT NULL , 
                            imageName TINYTEXT NULL , 
                            attachmentID TINYTEXT NULL DEFAULT NULL ,
                            attachmentUrl TINYTEXT NULL DEFAULT NULL  ,  
                            PRIMARY KEY (msgid),
                            FOREIGN KEY (userID) REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT,
                            FOREIGN KEY (profileID) REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE RESTRICT
                        ) ENGINE = InnoDB;`
                    )
                    resolve(true)
                }catch(e){
                    reject(e)
                }
            })
        }
        static saveContactRecord(profileID,userID,type){
            return new Promise(async (resolve,reject)=>{
                try{
                    await db.execute(`INSERT INTO contacts_${helpers.hash10(profileID)}(userID , ${type}) VALUES(?,?) ON DUPLICATE KEY UPDATE ${type}=?`,[userID,1,1])
                }catch(e){
                    if(e.code == "ER_NO_SUCH_TABLE"){
                        try{
                            await this.createContactTable(profileID)
                            await this.createContactRecord(profileID)
                        }catch(e){
                            reject(e)
                            return
                        } 
                    }else{
                        reject(e)
                        return
                    }
                }
                resolve(true)
            })
        }
        static saveProfile(infos){
            return new Promise(async (resolve,reject)=>{
                try{
                    let [insertProfileFields] = await db.execute(`INSERT IGNORE INTO 
                        profiles(
                            id,
                            idHash, 
                            profileName, 
                            gender, 
                            birthday, 
                            height, 
                            weight, 
                            hairLength, 
                            hairColor, 
                            eyeColor, 
                            zip, 
                            country, 
                            aboutMeDE, 
                            aboutMeOtherDE, 
                            eroticFantasyDE, 
                            aboutMeEN, 
                            aboutMeOtherEN, 
                            eroticFantasyEN, 
                            pic_fsk12_thumb, 
                            pic_fsk12_default, 
                            pic_fsk12_large, 
                            pic_fsk16_thumb, 
                            pic_fsk16_default, 
                            pic_fsk16_large, 
                            pic_fsk18_thumb,
                            pic_fsk18_default, 
                            pic_fsk18_large
                        ) 
                        VALUES(
                            :id,
                            :idHash, 
                            :profileName, 
                            :gender, 
                            :birthday, 
                            :height, 
                            :weight, 
                            :hairLength, 
                            :hairColor, 
                            :eyeColor, 
                            :zip, 
                            :country, 
                            :aboutMeDE, 
                            :aboutMeOtherDE, 
                            :eroticFantasyDE, 
                            :aboutMeEN, 
                            :aboutMeOtherEN, 
                            :eroticFantasyEN, 
                            :pic_fsk12_thumb, 
                            :pic_fsk12_default, 
                            :pic_fsk12_large, 
                            :pic_fsk16_thumb, 
                            :pic_fsk16_default, 
                            :pic_fsk16_large, 
                            :pic_fsk18_thumb,
                            :pic_fsk18_default, 
                            :pic_fsk18_large
                        )`, infos  
                    )
                    
                    await this.createContactTable(infos.id)
                    await this.createNotesTable(infos.id)
                    
                    resolve(infos)

                }catch(err){
                    reject(err)
                }
            })
        }
        
        static saveNote(profileID,note){
            return new Promise(async (resolve,reject)=>{
                try{
                    await db.execute(`INSERT INTO 
                        notes_${helpers.hash10(profileID)}(
                            userID,
                            notes_realname,
                            notes_city,
                            notes_zodiac,
                            notes_work,
                            notes_preferences,
                            notes_antipathy,
                            notes_fantasy,
                            notes_family,
                            notes_hobby,
                            notes_comment
                        )VALUES(
                            :user,
                            :name,
                            :home,
                            :zodiac,
                            :profession,
                            :preferences,
                            :antipathy,
                            :fantasy,
                            :family,
                            :hobby,
                            :comment
                        )`,note
                    )
                
                    

                }catch(e){
                    if(e.code == "ER_NO_SUCH_TABLE"){
                        try{
                            await this.createNotesTable(profileID)
                            await this.saveNote(profileID,note)
                        }catch(e){
                            reject(e)
                        } 
                    }else{
                        reject(e)
                    }
                }
                resolve(true)
            })
        }
        static saveMessage(profileID,userID,_data){
            return new Promise(async (resolve,reject)=>{
                try{
                   await db.execute(`INSERT IGNORE INTO dialog_${helpers.hash10(profileID)}_${helpers.hash10(userID)}(
                            msgid ,  
                            timestamp ,
                            sender, 
                            type  ,
                            text  ,  
                            imageUrl , 
                            imageName  , 
                            attachmentID,
                            attachmentUrl
                        )VALUES(
                            :message_id,
                            :time,
                            :sender,
                            :type,
                            :body,
                            :image_url,
                            :imageName,
                            :attachmentID,
                            :attachmentUrl
                        )`,_data
                    )
                
                    
                }catch(e){
                    if(e.code == "ER_NO_SUCH_TABLE"){
                        try{
                            await this.createDialogeTable(profileID,userID)
                            await this.saveMessage(profileID,userID,_data)
                        }catch(e){
                            reject(e)
                        }
                        
                    }else{
                        reject(e)
                    }
                }
                resolve(true)
            })
        }
        static saveUser(infos){
            return new Promise(async (resolve , reject)=>{
                try{
                    let [insertUserFields] = await db.execute(`INSERT IGNORE INTO 
                        users(
                            id,
                            idHash, 
                            username, 
                            gender, 
                            birthday, 
                            height, 
                            weight, 
                            hairLength, 
                            hairColor, 
                            eyeColor, 
                            zip, 
                            country, 
                            aboutMeDE, 
                            aboutMeOtherDE, 
                            eroticFantasyDE, 
                            aboutMeEN, 
                            aboutMeOtherEN, 
                            eroticFantasyEN, 
                            pic_thumb, 
                            pic_default, 
                            pic_large
                        ) 
                        VALUES(
                            :id,
                            :idHash, 
                            :username, 
                            :gender, 
                            :birthday, 
                            :height, 
                            :weight, 
                            :hairLength, 
                            :hairColor, 
                            :eyeColor, 
                            :zip, 
                            :country, 
                            :aboutMeDE, 
                            :aboutMeOtherDE, 
                            :eroticFantasyDE, 
                            :aboutMeEN, 
                            :aboutMeOtherEN, 
                            :eroticFantasyEN, 
                            :pic_thumb, 
                            :pic_default, 
                            :pic_large
                        )`, infos  
                    )
                    
                    resolve(true)
                }catch(e){
                    reject(e)
                }
                    

            })

            
        }
    }
}