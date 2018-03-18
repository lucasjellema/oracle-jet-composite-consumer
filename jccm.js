const octokit = require('@octokit/rest')()  //https://github.com/octokit/rest.js and https://octokit.github.io/rest.js/
const fs = require('fs');

var gitToken = "0bceb8a6b23eebd87369418b5854d5f434436901"

octokit.authenticate({
    type: 'token',
    token: gitToken
})

var targetProjectRoot = "C:/data/2018-jet-composite-component-consumer/" // at runtime, this becomes '.'
var sourceProjectRoot = "src/"
var compositesDirectory = "js/jet-composites/"
var targetDirectory = "src/" // at runtime this is public nistead of src

// NOTE: at runtime this is public nistead of src
var resourcePath = targetProjectRoot + targetDirectory+compositesDirectory + '/jet-composites.json'


var compositesRegistry = {}


async function install() { 
fs.exists(resourcePath, function (exist) {
    fs.readFile(resourcePath, 'utf8', function (err, data) {
        if (err) {
            console.log(`Error getting the file: ${err}.`);
        } else {
            // based on the URL path, extract the file extention. e.g. .js, .doc, ...
//            console.log(JSON.stringify(data))
            compositesRegistry = JSON.parse(data);
            compositesRegistry.forEach(async function(composite) {
                let  r = await installComposite(composite)
            })

        }

    })
})
}

async function installComposite(composite) {
    var repo = composite.github.repo;
    var nameComposite = composite.name
    var path =  nameComposite
    var owner = composite.github.owner
  
    // TODO:
    // - present a pretty report of what was created/updated
    // - print instructions on including composite component in the application
    //   * add 'jet-composites/<composite name>/loader to define section in viewModel'
    //   * check component.json for all properties to set (especially mandatory ones) (perhaps even list a summary from component.json)
    var target = `${targetProjectRoot}`
    // commit supersedes tag supersedes branch if they are all defined
    var ref = composite.github.commit?composite.github.commit:(composite.github.tag?composite.github.tag:(composite.github.branch?composite.github.branch:'master'))
  
    console.log(`Installing Composite ${composite.name} 
    from ${sourceProjectRoot+compositesDirectory+path} on ${ref} in ${composite.github.owner}\\${composite.github.repo} into ${targetProjectRoot+targetDirectory+compositesDirectory}`)
  
    processGithubDirectory(owner, repo, ref, sourceProjectRoot+compositesDirectory+path, sourceProjectRoot+compositesDirectory, targetProjectRoot+targetDirectory+compositesDirectory)
  }
  
  // let's assume that if the name ends with one of these extensions, we are dealing with a binary file:
  const binaryExtensions = ['png', 'jpg', 'tiff', 'wav', 'mp3', 'doc', 'pdf']
  var maxSize = 1000000;
  function processGithubDirectory(owner, repo, ref, path, sourceRoot, targetRoot) {


    console.log(`##### processGithubDirectory  path: ${path} , sourceRoot ${sourceRoot}, targetRoot ${targetRoot}`)
  //   octokit.repos.getContent({ "owner": owner, "repo": repo, "path": path, "ref": ref })
  //   .then(result => {
  
  //console.log(`get content ${owner}, ${repo}, ${path}. ${ref}`)
   octokit.repos.getContent({ "owner": owner, "repo": repo, "path": path, "ref": ref })
       .then(result => {
           var targetDir = targetProjectRoot+targetDirectory + path.substr(4) // strip off src; note: +src becomes public for runtime  
           // check if targetDir exists 
        //   console.log(`Check if target directory ${targetDir} exists `)
           checkDirectorySync(targetDir)
           result.data.forEach(item => {
               //  console.log(""+JSON.stringify(item))
  //              console.log("Item " + item.name + "  " + item.path + "   " + item.type + item.size)
               if (item.type == "dir") {
                   processGithubDirectory(owner, repo, ref, item.path, sourceRoot,targetRoot)
               } // if directory
               if (item.type == "file") {
                   if (item.size > maxSize) {
   //                    console.log("Item too big to handle " + item.path)
                       var sha = item.sha
                       octokit.gitdata.getBlob({ "owner": owner, "repo": repo, "sha": item.sha }
                       ).then(result => {
                           var target = `${targetProjectRoot+targetDirectory+item.path.substr(4)}`
                           fs.writeFile(target
                               , Buffer.from(result.data.content, 'base64').toString('utf8'), function (err, data) { })
                       })
                       .catch((error) => {console.log("ERROR BIGGA"+error)})
                       return;
                   }// if bigga
                 //  console.log(`get content ${owner}, ${repo}, ${item.path}. ${ref}`)
  
                   // get content for src/js/jet-composites/input-country/README.mdowner lucasjellema repo: jet-composite-component-showroom ref master
                   // get content for src/js/jet-composites/input-country/README.mdowner lucasjellema repo: jet-composite-component-showroom ref master
  
                   octokit.repos.getContent({ "owner": owner, "repo": repo, "path": item.path, "ref": ref })
                       .then(result => {
                       //                                console.log(result)
                       //    console.log("Size " + result.data['size'])
                       //    console.log(result.meta['content-type'])
                           //                            console.log(Buffer.from(result.data.content, 'base64').toString('utf8'))
                           // write file to targetProjectRoot/nameComposite/path of item
                           // if result.meta.content-type indicates a binary type, then do something else...
                           var target = `${targetProjectRoot+targetDirectory+item.path.substr(4)}`
                   //        console.log(`Writing file to ${target}`)
  
                           if (binaryExtensions.includes(item.path.slice(-3))) {
           //                    console.log("binary! " + item.path)
                               fs.writeFile(target
                                   , Buffer.from(result.data.content, 'base64'), function (err, data) { reportFile(item, target) })
  
                           } else
                               fs.writeFile(target
                                   , Buffer.from(result.data.content, 'base64').toString('utf8'), function (err, data) 
                                   { if (!err) reportFile(item, target); else console.log('Fuotje '+err)})
  
                       })
                       .catch((error) => {console.log("ERROR "+error)})
               }// if file
           })
       }).catch((error) => {console.log("ERROR XXX"+error)})
  }//processGithubDirectory
  
function reportFile(item, target) {
    console.log(`- installed ${item.name} (${item.size} bytes )in ${target}`)
}

function checkDirectorySync(directory) {
    try {
        fs.statSync(directory);
    } catch (e) {
        fs.mkdirSync(directory);
        console.log("Created directory: " + directory)
    }
}
install().then(console.log("Done installing"))


getTimestampAsString = function (theDate) {
    var sd = theDate ? theDate : new Date();
try{
    var ts = sd.getUTCFullYear() + '-' + (sd.getUTCMonth() + 1) + '-' + sd.getUTCDate() + 'T' + sd.getUTCHours() + ':' + sd.getUTCMinutes() + ':' + sd.getSeconds();
    return ts;
}catch (e){"getTimestampAsString exception "+JSON.stringify(e)}
}
