import bcrypt from 'bcrypt'
async function checkPassword(){
    const res = await bcrypt.compare("Qwert@12","$2b$10$feYg62lSq0DFPXGfoZ2f9OvPHBnu9bTYzmt4eu5RnKWJaAk7GmlNS")
    console.log(res);
    
    return res;
}

checkPassword()