const saxjs = require("sax");
const http = require("https");

class Insults {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  public getInsult(callback) {
    this.getXmlString().then(this.getJSON).then(callback);//  (data) => {this.getJSON(data, callback);});
  }
  
  private getXmlString(): Promise<string> {
    return new Promise<string>((resolve: any, reject: any) => {
      var request = http.request(this.url,  // create a new agent just for this one request
      (response: any) => {
          // Continuously update stream with data
          var responsebody = '';
          response.on('data', function(d) {
              responsebody += d;
          });
          // callback with stream response.
          response.on('end', function() {
              resolve(responsebody);
          });
      });
      request.end();
    });
  }
  
  private getJSON(xml: string): string {
    var parser = saxjs.parser(true);
    var isInsult = false;
    var insult = '';
    parser.onattribute = function (attr) {
      if (attr.name === 'class' && attr.value === 'insult-text') {
        isInsult = true;
      }
    }

    parser.ontext = function (text) {
      if (isInsult) {
        insult = text;
        isInsult = false;
      }
    }
    
    parser.write(xml).end();
    return insult;
    /*var fs = require('fs');
    fs.writeFile('test.json', JSON.stringify(entrys));*/
  }
  
}

//rss = new Rss("http://redfrex.net/overfeed");
//rss.getXmlString((obj) => {console.log(obj.body);});
export {Insults}