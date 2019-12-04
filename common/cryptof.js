/**
 * Created by pbear on 3/29/2017.
 */
module.exports = {
    getHash: function(crypto, base_value) {
        try
        {
            console.log("base_value=",base_value);
            var key = new Buffer(base_value, 'utf8');
            var shasum = crypto.createHash('sha1');
            shasum.update(key);
            key = shasum.digest('base64');
            //console.log(key);
            return key;
        }
        catch (exception)
        {
            console.log(exception);
            return null;
        }
    },
};