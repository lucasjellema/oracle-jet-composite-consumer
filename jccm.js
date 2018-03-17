const octokit = require('@octokit/rest')()  //https://github.com/octokit/rest.js and https://octokit.github.io/rest.js/
const fs = require('fs');

var gitToken = "0bceb8a6b23eebd87369418b5854d5f434436901"

octokit.authenticate({
    type: 'token',
    token: gitToken
})

var targetProjectRoot = "C:/data/2018-jet-composite-component-consumer/"
var compositesDirectory = "src/js/jet-composites"

var resourcePath = targetProjectRoot + compositesDirectory + '/jet-composites.json'


var compositesRegistry = {}
fs.exists(resourcePath, function (exist) {
    fs.readFile(resourcePath, 'utf8', function (err, data) {
        if (err) {
            console.log(`Error getting the file: ${err}.`);
        } else {
            // based on the URL path, extract the file extention. e.g. .js, .doc, ...
            console.log(JSON.stringify(data))
            compositesRegistry = JSON.parse(data);
            compositesRegistry.forEach(composite => {
                console.log("Composite " + JSON.stringify(composite))
                installComposite(composite)
            })

        }

    })
})
async function installComposite(composite) {


    var repo = composite.github.repo;
    var nameComposite = composite.name
    var path = "src/js/jet-composites/" + nameComposite
    var owner = composite.github.owner

    // TODO:
    // - present a pretty report of what was created/updated
    // - print instructions on including composite component in the application
    //   * add 'jet-composites/<composite name>/loader to define section in viewModel'
    //   * check component.json for all properties to set (especially mandatory ones) (perhaps even list a summary from component.json)
    var target = `${targetProjectRoot}`
    processGithubDirectory(owner, repo, 'master', path, target)
}

                            // let's assume that if the name ends with one of these extensions, we are dealing with a binary file:
const binaryExtensions = ['png','jpg','tiff','wav','mp3','doc','pdf']
var maxSize = 1000000;
function processGithubDirectory(owner, repo, ref, path, targetDir) {
console.log(`processGithubDirectory  path: ${path} , targetDir ${targetDir}`
)
    octokit.repos.getContent({ "owner": owner, "repo": repo, "path": path, "ref": ref })
        .then(result => {
            // check if targetDir exists 
            checkDirectorySync(targetDir+path)   
            result.data.forEach(item => {
                //  console.log(""+JSON.stringify(item))
                console.log("Item " + item.name + "  " + item.path + "   " + item.type+ item.size)
                if (item.type == "dir") {
                    processGithubDirectory(owner, repo, 'master', item.path, targetDir)

                } // if directory
                if (item.type == "file") {
                    if (item.size > maxSize) 
                    {
                        console.log("Item too big to handle "+item.path)
return;
                    } 
                    octokit.repos.getContent({ "owner": owner, "repo": repo, "path": item.path, "ref": "master" })
                        .then(result => {
//                            console.log(result)
console.log("Size "+result.data['size'])
console.log(result.meta['content-type'])
//                            console.log(Buffer.from(result.data.content, 'base64').toString('utf8'))
                            // write file to targetProjectRoot/nameComposite/path of item
                            // if result.meta.content-type indicates a binary type, then do something else...
                            var target = `${targetDir}${item.path}`
                            console.log(`Writing file to ${target}`)

                            if  (binaryExtensions.includes(item.path.slice(-3)) ) {
console.log("binary! "+ item.path)
fs.writeFile(target
    , new Buffer(result.data.content), function (err, data) { })

} else
                            fs.writeFile(target
                                , Buffer.from(result.data.content, 'base64').toString('utf8'), function (err, data) { })

                        })
                }// if file
            })
        })
}


function checkDirectorySync(directory) {  
    try {
      fs.statSync(directory);
    } catch(e) {
      fs.mkdirSync(directory);
    }
  }
//run();