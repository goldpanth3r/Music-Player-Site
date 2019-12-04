var http=require('http')
var fs=require('fs')
var querystring=require('querystring')
var nodemailer=require('nodemailer')
var MongoClient=require('mongodb').MongoClient
var express=require('express');
const sqlite3 = require('sqlite3').verbose();

var app = express();
var song_to_download = '';

app.get('/' , function(req,res){
    res.writeHead(200,{"Content-Type":"text/html"});
    fs.createReadStream("login_page.html","UTF-8").pipe(res);
}
);

app.get('/load_home_page',function(req,res){

    let db = new sqlite3.Database('./songs_data.db'); 
    db.serialize(function() {  

        let total_count = 0;
        db.all("SELECT COUNT(song_name) from songs",function(err,rows){  
            if(err)  
            {  
                console.log(err);  
            }  
            else
            {
                
                total_count = rows[0]['COUNT(song_name)'];
                //console.log( Math.floor(Math.random() * total_count) );
                //console.log(total_count)
            }  

        });

        db.all("SELECT * from songs",function(err,rows){  
            if(err)  
                                 {  
                console.log(err);  
            }  
            else
            {  
                //res.send( JSON.stringify(rows) );  
                let content_list = [];
                for(let i=1;i<=10;i++)
                {
                    let random_index = Math.floor(Math.random() * total_count);
                    content_list.push( JSON.stringify( rows[random_index] ) );   
                }
                content_list = '[' + content_list.join(',') + ']';
                res.send( content_list );
                
            }  

        });  

    });
    db.close();

}); //app.get('/load_home_page'....


app.post('/search_songs',function(req,res){

    var data ='';
    req.setEncoding('UTF-8');

    req.on('data',function(chunk){
        data += chunk;
    });

    req.on('end',function(){
        data = JSON.parse( data );
        let search_text = data['search_text'];

        let db = new sqlite3.Database('./songs_data.db'); 
        db.serialize(function() {  
    
            db.all("SELECT * from songs",function(err,rows){  
                if(err)  
                                     {  
                    console.log(err);  
                }  
                else
                {  
                    //res.send( JSON.stringify(rows) ); 
                     
                    let content_list = [];
                    for(let i=0;i<rows.length;i++)
                    {
                        let song_name = rows[i]['song_name'];
                        let artists_name = rows[i]['artists_name'];
                        let pattern = new RegExp(search_text,"gi");
                        if( pattern.exec(song_name) || pattern.exec(artists_name) )
                        {
                            content_list.push( JSON.stringify( rows[i] ) );
                        }
                        
                           
                    }
                    
                    content_list = '[' + content_list.join(',') + ']';
                    res.send( content_list );
                               
                }  
    
            });  
    
        });//db.serialise
        db.close();

    });//req.on('end)

});

//playlist server side

// playlist server side setup


app.post('/add_playlist',function(req,res){
    var content_list=[];
    var data ='';
    req.setEncoding('UTF-8');

    req.on('data',function(chunk){
        data += chunk;
    });

    req.on('end',function(){
        data = JSON.parse( data );
        let song_name = data['song_name'];

        let db = new sqlite3.Database('./songs_data.db'); 
        db.serialize(function() {  
    
            db.all("SELECT * from songs",function(err,rows){  
                if(err)  
                                     {  
                    console.log(err);  
                }  
                else
                {  
                    //res.send( JSON.stringify(rows) ); 
                     
                    
                    for(let i=0;i<rows.length;i++)
                    {
                        let song = rows[i]['song_name'];


                        if((song_name)==(song) )
                        {
                            content_list.push(JSON.stringify( rows[i] ));
                        }
                        
                    }
                    content_list = '[' + content_list.join(',') + ']';
                    res.send( content_list );     
                }  
    
            });  
    
        });//db.serialise
        db.close();

    });//req.on('end)

});




app.post('/download_songs',function(req,res){

    var data ='';
    req.setEncoding('UTF-8');

    req.on('data',function(chunk){
        data += chunk;
    });

    req.on('end',function(){

        data = JSON.parse( data );       
        song_to_download = data['download_song'];

        res.send('File yet to be downloaded');
    });//req.on('end)

});//app.post('/download_songs')


//final download
app.post('/payment_done_download',function(req,res){

    var data ='';
    req.setEncoding('UTF-8');

    req.on('data',function(chunk){
        data += chunk;
    });

    req.on('end',function(){

        //res.writeHead(200,{"Content-Type":"text/html"});
        //fs.createReadStream("./register.html","UTF-8").pipe(res);
        let db = new sqlite3.Database('./songs_data.db'); 
        db.serialize(function() {  
    
            db.all("SELECT * from songs",function(err,rows){  
                if(err)  
                                     {  
                    console.log(err);  
                }  
                else
                {  
                    //res.send( JSON.stringify(rows) ); 
                     
                    for(let i=0;i<rows.length;i++)
                    {
                        let song_name = rows[i]['song_name'];
                        if( song_name == song_to_download )
                        {
                            let song_filename = rows[i]['song_filename'];
                            //res.header({"Content-Disposition":"attachment; filename='"+ song_filename +"'"});
                            //fs.createReadStream(song_filename).pipe(res);
                            
                            //res.download( song_filename );

                            //res.writeHead(200,{"Content-Type":"audio/mpeg"});
                            //fs.createReadStream( song_filename ,"binary").pipe(res);

                            res.send( song_filename );
                            console.log('Sending file');
                        }
                        
                           
                    }                   
                               
                }//else  
    
            });//db.all( )  
    
        });//db.serialise
        db.close();

    });//req.on('end)

});//app.post('/payment_done_download')


app.use('/', express.static(__dirname)   );

//POST function
app.post('/login',function(req,res){
    var data="";
    var flag_isthere=0,wrongpass=0;
    console.log('login-done');
    req.setEncoding('UTF-8')
    req.on('data',function(chunk){
        data+=chunk;
    });
    req.on('end',function()
    {
        
        
        MongoClient.connect("mongodb://localhost:27017/userdetails",{useNewUrlParser: true ,useUnifiedTopology: true },function(err,db)
        {
            
            if(err) throw err;
            var q = JSON.parse(data)
            const mydb=db.db('userdetails')
            var c=mydb.collection('signup').find().toArray(
                function(err,array)
                {
                    for(var i=0;i<array.length;i++)
                        if( (array[i].email==q['email']) )
                        {
                            flag_isthere=1;
                            if( (array[i].pass != q['pass'] ) )
                                wrongpass=1;
                            break;
                        }
 
                    if (flag_isthere == 0) 
                    {
                        console.log(q['email'], ' is not registered');
                        res.send( { login:'', error: 'E-mail not registered, Please register to Log In'} );
                    } 
                    else 
                    {
                        console.log('Already exists!!!');
                    }

                    if (flag_isthere == 1 && wrongpass == 0) 
                    {
                        console.log('Congratulations,username and password is correct');
                        res.send({ login: 'OK', error: '' } ); 
                    }
                    else if (wrongpass == 1) 
                    {
                        console.log('password entered is wrong')
                        res.send( { login:'' , error:'Password incorrect'} );
                    } 
                    else
                    {
                        // Handle the issue that there was no match
                        // *** res.send(/*...*/)
                    }
        
                });//var c
        })//mongoclient.connect



    })//req.on 

    //res.send({ login:'OK', error:'' });
    
});

app.post('/sendregister',function(req,res){
    res.writeHead(200,{"Content-Type":"text/html"});
    fs.createReadStream("./register.html","UTF-8").pipe(res);
});

app.post('/register',function(req,res){
    var data="";
    console.log('registration-done');
    req.setEncoding('UTF-8')
    req.on('data',function(chunk){
        data+=chunk;
    });
    req.on('end',function()
    {
        MongoClient.connect("mongodb://localhost:27017/userdetails",{useNewUrlParser: true ,useUnifiedTopology: true },function(err,db)
        {
            
            if(err) throw err;
            var q = JSON.parse(data)
            console.log(q['email']);
            const mydb=db.db('userdetails')
            var c=mydb.collection('signup').find().toArray(
                function(err,res)
                {
                    var flag_isthere=0;
                    for(var i=0;i<res.length;i++)
                        if((res[i].email==q['email']))
                        {
                            flag_isthere=1;
                            break;
                        }
                    if(flag_isthere==0)
                    {
                        mydb.collection('signup').insertOne(q,function(err,res){
                            if(err) throw err;

                            var transporter=nodemailer.createTransport({
                            service:'gmail',
                            auth:{
                                user:'trollbakchodiofficial@gmail.com',
                                pass:'booyakabooyaka@619'
                                }
                            })
                            var mailOptions={
                                from:'trollbakchodiofficial@gmail.com',
                                to:q['email'],
                                subject:'Successfull Subcription to sangeetha Music player',
                                text:'Thank you for opting to sangeetha music website,.... booyah'
                            }
                            transporter.sendMail(mailOptions,function(error,info) {
                                if(error)
                                {
    				                console.log(error)
	    		                }
                                else
                                {
                                    console.log('Email sent')
                                }
                            })
                            db.close();
        
                        } )
                    }
                    else
                    {
                        console.log('Already exists!!!');   
                        let query = { 'email': q['email']  };
                        let new_values = { $set: { 'email' : q['email'], 'pass' : q['pass']  }  };
                        mydb.collection('signup').updateOne( query , new_values , function(err,res){
                            console.log(q['email'],' updated with new password')
                            db.close();
                        });   
                    }

        
            });//var c
        })//mongoclient.connect

    })//req.on 


    res.send({ register:'OK', error:'' });

});



app.listen(8000,function(){ console.log('running at port 8000'); } );