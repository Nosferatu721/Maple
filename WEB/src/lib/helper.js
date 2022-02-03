const helpers = {}

helpers.filterItems = (arr, query) => {
  return arr.filter(function(el) {
    return el.toLowerCase().indexOf(query.toLowerCase()) !== -1
  })
}

helpers.obtain = (obj,name) =>{
  var result = null;
  var value  = null;
  for(var key in obj){        
      value = obj[key];
      if(key == name){
        let groups = value.split(",")
        console.log(groups);
        if (groups.includes("OU=Avantel") || groups.includes("OU=Wom") || groups.includes("OU=RPA")){//laika))
          console.log(groups)
          split2 = helpers.filterItems(groups, 'CN')
          let nombre = (split2[0].split("="))[1]
          var result = {
            nombre: nombre,
            grupo: true,
          };
          return result;
        }else{

          var result = {
            nombre: "N/A",
            grupo: false,
          };
          return result;

        }
      
  } else {
      if( typeof value == "object" ){
      result = helpers.obtain(value,name);
      }
  }
}
return result;
}


module.exports = helpers
