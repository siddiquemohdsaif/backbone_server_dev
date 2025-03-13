

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

const test = async () => {
    let uids = [];
    for(let i=0; i<10000; i++){
        uids.push(i);
    }

    let st = Date.now();
    for (let uid of uids) {
        await sleep(10);
        //console.log(uid);
    }
    //console.log( "t :" +(st-Date.now()));
}


test();