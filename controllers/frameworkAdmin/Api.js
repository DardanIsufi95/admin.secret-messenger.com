module.exports = function({
    apiFetch : fetch,
    helpers
}){
    return class Api{
        static getAllProfiles(){
            return new Promise(async (resolve,reject)=>{
                try{

                    let profileArrFetch = await fetch("https://brokkr.amateurcommunity.com/api/profiles")

                    let profileArrText = await profileArrFetch.text()

                    let profileArr = JSON.parse(profileArrText)

                    resolve(profileArr)
                }catch(err){
                    await helpers.wait(500)
                    let profileArr = await this.getAllProfiles()
                    resolve(profileArr)
                }
            })
        }
        static getProfileInfo(profileID){
            return new Promise(async (resolve,reject)=>{
                try{
                    let infosFetch = await fetch(`https://brokkr.amateurcommunity.com/api/profile/${profileID}`)

                    let infosText = await infosFetch.text()

                    let infos = JSON.parse(infosText)

                    let data ={
                        id: profileID,
                        idHash: helpers.hash10(profileID),
                        profileName: infos.nickname || null,
                        gender: infos.partner.gender || null,
                        birthday: infos.partner.birthday || null,
                        height: infos.partner.height || null,
                        weight: infos.partner.weight || null,
                        hairLength: infos.partner.hair_length || null,
                        hairColor: infos.partner.hair_color || null,
                        eyeColor: infos.partner.eye_color || null,
                        zip: infos.public.zip || null,
                        country: infos.public.country || null,
                        aboutMeDE: infos.free_texts.what_i_say_about_me.de || null,
                        aboutMeOtherDE: infos.free_texts.what_others_say_about_me.de || null,
                        eroticFantasyDE: infos.free_texts.erotic_fantasy.de || null,
                        aboutMeEN: infos.free_texts.what_others_say_about_me.en || null,
                        aboutMeOtherEN: infos.free_texts.what_i_say_about_me.en || null,
                        eroticFantasyEN: infos.free_texts.erotic_fantasy.en || null,
                        pic_fsk12_thumb:typeof(infos.profile_images.fsk12) != "undefined" ? infos.profile_images.fsk12.thumbnail : null ,
                        pic_fsk12_default:typeof(infos.profile_images.fsk12) != "undefined" ? infos.profile_images.fsk12.default : null,
                        pic_fsk12_large:typeof(infos.profile_images.fsk12) != "undefined" ? infos.profile_images.fsk12.large : null,
                        pic_fsk16_thumb:typeof(infos.profile_images.fsk16) != "undefined" ? infos.profile_images.fsk16.thumbnail : null,
                        pic_fsk16_default:typeof(infos.profile_images.fsk16) != "undefined" ? infos.profile_images.fsk16.default : null,
                        pic_fsk16_large:typeof(infos.profile_images.fsk16) != "undefined" ? infos.profile_images.fsk16.large : null,
                        pic_fsk18_thumb:typeof(infos.profile_images.fsk18) != "undefined" ? infos.profile_images.fsk18.thumbnail : null,
                        pic_fsk18_default:typeof(infos.profile_images.fsk18) != "undefined" ? infos.profile_images.fsk18.default : null,
                        pic_fsk18_large:typeof(infos.profile_images.fsk18) != "undefined" ? infos.profile_images.fsk18.large : null,
                    }

                    resolve(data)

                }catch(err){
                    await helpers.wait(500)
                    let data = await this.getProfileInfo(profileID)
                    resolve(data)
                }
            }) 
        }
        static getFavorites(profileID){
            return new Promise(async (resolve,reject)=>{
                try{

                    let profileFavoritesArrFetch = await fetch(`https://brokkr.amateurcommunity.com/api/profile/${profileID}/favorites`)

                    let profileFavoritesArrText = await profileFavoritesArrFetch.text()

                    let profileFavoritesArr = JSON.parse(profileFavoritesArrText)

                    resolve(profileFavoritesArr)
                }catch(err){
                    await helpers.wait(500)
                    let profileFavoritesArr = await this.getFavorites()
                    resolve(profileFavoritesArr)
                }
            })
        }
        static getNotes(profileID){
            return new Promise(async (resolve,reject)=>{
                try{

                    let notesFetch = await fetch(`https://brokkr.amateurcommunity.com/api/profile/${profileID}/notes`)

                    let notesText = await notesFetch.text()

                    let notes = JSON.parse(notesText)

                    resolve(notes)

                }catch(err){

                    await helpers.wait(500)
                    let notes = await this.getNotes(profileID)
                    resolve(notes)
                }
            })
        }
        static getDialogsAll(profileID,offset,read){
            return new Promise(async (resolve,reject)=>{
                let url = `https://brokkr.amateurcommunity.com/api/profile/${profileID}/dialogs?offset=${offset || "0"}&`
                let read_param = ""
                if(typeof(read) != undefined){
                    read_param = read 
                }
                url+=read_param
                try{

                    let profileDialogsArrFetch = await fetch(url)

                    let profileDialogsArrText = await profileDialogsArrFetch.text()

                    let profileDialogsArr = JSON.parse(profileDialogsArrText)

                    resolve(profileDialogsArr)
                }catch(err){
                    await helpers.wait(500)
                    let profileDialogsArr = await this.getDialogsAll(profileID,offset,read)
                    resolve(profileDialogsArr)
                }
            })
        }
        static getUserInfo(userID){
            return new Promise(async (resolve,reject)=>{
                try{
                    let infosFetch = await fetch(`https://brokkr.amateurcommunity.com/api/user/${userID}`)

                    let infosText = await infosFetch.text()

                    let infos = JSON.parse(infosText)

                    let data ={
                        id: userID,
                        idHash: helpers.hash10(userID),
                        username: infos.nickanme || null,
                        birthday: infos.partner.birthday || null,
                        gender: infos.partner.gender || null,
                        height: infos.partner.height || null,
                        weight: infos.partner.weight || null,
                        hairLength: infos.partner.hair_length || null,
                        hairColor: infos.partner.hair_color || null,
                        eyeColor: infos.partner.eye_color || null,
                        zip: infos.public.zip || null,
                        country: infos.public.country || null,
                        aboutMeDE: infos.free_texts.what_i_say_about_me.de || null,
                        aboutMeOtherDE: infos.free_texts.what_others_say_about_me.de || null,
                        eroticFantasyDE: infos.free_texts.erotic_fantasy.de || null,
                        aboutMeEN: infos.free_texts.what_others_say_about_me.en || null,
                        aboutMeOtherEN: infos.free_texts.what_i_say_about_me.en || null,
                        eroticFantasyEN: infos.free_texts.erotic_fantasy.en || null,
                        pic_thumb:infos.profile_images.thumbnail || null ,
                        pic_default: infos.profile_images.default || null,
                        pic_large: infos.profile_images.large || null
                    }
                    resolve(data)
                }catch(err){
                    await helpers.wait(500)
                    let data = await this.getUserInfo(userID)
                    resolve(data)
                }
            }) 
        }
    }
}