module.exports = function({
    bcrypt
}){
    return class helpers {
    
        static redisPrep(object){
            let arr = []
            for (const key in object) {
                
                if (object.hasOwnProperty(key)) {
                    const element = object[key];
                    if(typeof(element) != undefined && element != null){
                        arr.push(key)
                        arr.push(element)
                    }
                    
                }
            }
        
            return arr
        }
        
        static comparePasswordHash(password,_hash){
            return new Promise((resolve,reject)=>{
                let hash = _hash.replace('$2y$', '$2a$')
                bcrypt.compare(password, hash , async function(err, correct) {
                    if(err){
                        resolve(false)
                    }else{
                        resolve(correct)
                    }
                })
            })
        }


        static hash10(string){
            let hashValArr = [0,0,0,0,0,0,0,0,0,0]

            let chars =["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"]
            let string_arr = string.toLowerCase().split("")
            let sum = 0

            for (let i = 0; i < string_arr.length; i++) {
                let letter = string_arr[i];
                sum += chars.indexOf(letter)
                let letterNr = chars.indexOf(letter)
                
                let hashValArr_position = (i + letterNr) % hashValArr.length
                
                let toAdd = 0

                if(letterNr != 0){
                    toAdd = ( letterNr + Math.floor(sum / letterNr) ) % chars.length
                }

                hashValArr[hashValArr_position] += toAdd
                
            }

            hashValArr.forEach((val,i) => {
                hashValArr[i] = chars[hashValArr[i] % chars.length]
                
            })

            return hashValArr.join("")
        }

        static wait(ms){
            return new Promise((resolve,reject)=>{
                setTimeout(resolve,ms)
            })
        }
        
    }
}