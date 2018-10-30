'use strict'

var IPFS = require('ipfs-api');

var ipfs = IPFS()

var contractStudyABI = require('./uploadStudyABI.json').abi;
console.log("study abi is", contractStudyABI)
var contractStudyAddress = '0xfa2c965c2d3173707784d09dece5c9343fb167c5';

function store() {
    var toStore = document.getElementById('source').value;
    var studyID = document.getElementById('studyid').value;
    ipfs.files.add(Buffer.from(toStore), function (err, res) {
        if (err || !res) {
            return console.error('ipfs add error', err, res)
        }

        res.forEach(function (file) {
            if (file && file.hash) {
                console.log('successfully stored', file.hash)
                saveNewDataUploadToContract(file.hash, studyID);
                display(file.hash)
                
            }
        })
    })
}

function lookup() {
    console.log('lookup');
    var studyID = document.getElementById('studyidlookup').value;
    console.log('sid', studyID)
    lookupStudyID(studyID);
}

function display(hash) {
    ipfs.files.cat(hash, function (err, res) {
        if (err || !res) {
            return console.error('ipfs cat error', err, res)
        }

        document.getElementById('hash').innerText = hash
        document.getElementById('content').innerText = res.toString()
    })
}

function displayIPFSInfo(){
    let node = this;
    const hash = this.innerText;
    ipfs.files.cat(hash, function (err, res) {
        if (err || !res) {
            return console.error('ipfs cat error', err, res)
        }
        let content_node = document.getElementById('content')
        let new_cn = content_node.cloneNode(true);
        new_cn.innerText = res.toString();
        node.appendChild(new_cn)
    })
}

function displayTXHash(hash){
    document.getElementById('txHash').innerText = hash
}



document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('store').onclick = store;
    document.getElementById('lookup').onclick = lookup;
})

function lookupStudyID(studyID){
    console.log('looking up', studyID)
    let studyUploadContractInstance = web3.eth.contract(contractStudyABI).at(contractStudyAddress);
    return new Promise( (resolve, reject) => {
        return studyUploadContractInstance.getNumDataForStudy(studyID, function (err, res) {
            console.log('err', err);
            console.log('res', res);
            const numDataUploads = res.toNumber();
            resolve(numDataUploads)
        })
    }).then( numDataUploads => {
        
        let getDataPromiseArray = [];
        for (let i = 0; i < numDataUploads; i++) {
            getDataPromiseArray.push( findStudyHash(studyID, i))
        }
        return Promise.all(getDataPromiseArray);
    })
}

function findStudyHash(studyID, index){
    let studyUploadContractInstance = web3.eth.contract(contractStudyABI).at(contractStudyAddress);
    let uploadSection = document.getElementById("upload-section");
    let p = document.getElementById("specific-upload");
    p.style.display = 'none';
    return new Promise((resolve, reject) => {
        studyUploadContractInstance.studies.call(studyID, index, function (err, res) {
            console.log('err is', err);
            console.log('res is', res);
            const timestamp = res[0].toNumber();
            console.log('timestamp is', timestamp)
            let date = new Date(timestamp * 1000);
            var p_prime = p.cloneNode(true);
            p_prime.style.display = 'block';
            p_prime.querySelectorAll('[id="timestamp-date"]')[0].innerText = date;
            p_prime.querySelectorAll('[id="ipfs-hash"]')[0].innerText = res[1];
            p_prime.querySelectorAll('[id="ipfs-hash"]')[0].addEventListener("click", displayIPFSInfo);
            uploadSection.appendChild(p_prime);
            resolve();
        });
    })
}

function saveNewDataUploadToContract(ipfsHash, studyID) {
    console.log('saving to contract', studyID, ipfsHash)
    let studyUploadContractInstance = web3.eth.contract(contractStudyABI).at(contractStudyAddress);
    return studyUploadContractInstance.addStudy(studyID, ipfsHash, function (err, result) {
        console.log('err is', err);
        console.log('result is', result);
        displayTXHash(result);
    })
}

window.addEventListener('load', async () => {
    // Modern dapp browsers...
    if (window.ethereum) {
        console.log('yes ethereum', ethereum);
        window.web3 = new Web3(ethereum);
        console.log('new web3')
        try {
            // Request account access if needed
            console.log('try to request access');
            await ethereum.enable();
            console.log('is exposed');
            // Acccounts now exposed
            // web3.eth.sendTransaction({/* ... */ });
        } catch (error) {
            console.log('denied access', error)
            // User denied account access...
        }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
        console.log('legacy browser')
        window.web3 = new Web3(web3.currentProvider);
        // Acccounts always exposed
        // web3.eth.sendTransaction({/* ... */ });
    }
    // Non-dapp browsers...
    else {
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
});

