var a = "ValorEnCrypt";
var jxiautqolv_xsayswkevevbrpaix = "Comprobar";
var __zw_okpqq_cbc_t_ttjqzq_igdfqhmkyotli = "Comprobar2";
var qtadkcpffmbtonpbsubfuxy = "Comprobar3";
var fxpwdrh_jukpoldcsbuuetayzopfowdoaq = "ResultadoEnCrypt";
var qujh_keksq_etjrsriyumaeuixsht = "i";
var sohnsbrxtlyhcwndco_v_hzs_ = "ord";
var baxqqnchsyninfatsseewokxsux_vawt = "hexCode";

var Base64 = {
  _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

  encode: function (input) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    input = Base64._utf8_encode(input);

    while (i < input.length) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }

      output =
        output +
        this._keyStr.charAt(enc1) +
        this._keyStr.charAt(enc2) +
        this._keyStr.charAt(enc3) +
        this._keyStr.charAt(enc4);
    }

    return output;
  },

  decode: function (input) {
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;

    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    while (i < input.length) {
      enc1 = this._keyStr.indexOf(input.charAt(i++));
      enc2 = this._keyStr.indexOf(input.charAt(i++));
      enc3 = this._keyStr.indexOf(input.charAt(i++));
      enc4 = this._keyStr.indexOf(input.charAt(i++));

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      output = output + String.fromCharCode(chr1);

      if (enc3 != 64) {
        output = output + String.fromCharCode(chr2);
      }
      if (enc4 != 64) {
        output = output + String.fromCharCode(chr3);
      }
    }

    output = Base64._utf8_decode(output);

    return output;
  },

  _utf8_encode: function (string) {
    string = string.replace(/\r\n/g, "\n");
    var utftext = "";

    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }

    return utftext;
  },

  _utf8_decode: function (utftext) {
    var string = "";
    var i = 0;
    var c = (c1 = c2 = 0);

    while (i < utftext.length) {
      c = utftext.charCodeAt(i);

      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      } else if (c > 191 && c < 224) {
        c2 = utftext.charCodeAt(i + 1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      } else {
        c2 = utftext.charCodeAt(i + 1);
        c3 = utftext.charCodeAt(i + 2);
        string += String.fromCharCode(
          ((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)
        );
        i += 3;
      }
    }

    return string;
  },
};

function ord(str) {
  return str.charCodeAt(0);
}

function dechex(number) {
  if (number < 0) {
    number = 0xffffffff + number + 1;
  }

  return number.toString(16);
}

function hexdec(s) {
  s = (s + "").replace(/[^a-f0-9]/gi, "");
  return parseInt(s, 16);
}

String.prototype.rot13 = function () {
  return this.replace(/[a-zA-Z]/g, function (c) {
    return String.fromCharCode(
      (c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26
    );
  });
};

function substr(str, pos) {
  return str.substr(pos);
}

function EnCrypt(a) {
  if (a == "" || a == null) {
    return "";
  } else {
    var jxiautqolv_xsayswkevevbrpaix = "";
    var __zw_okpqq_cbc_t_ttjqzq_igdfqhmkyotli = "";
    var qtadkcpffmbtonpbsubfuxy = "";
    var fxpwdrh_jukpoldcsbuuetayzopfowdoaq = "";

    for (
      qujh_keksq_etjrsriyumaeuixsht = 0;
      qujh_keksq_etjrsriyumaeuixsht < a.length;
      qujh_keksq_etjrsriyumaeuixsht++
    ) {
      sohnsbrxtlyhcwndco_v_hzs_ = ord(a[qujh_keksq_etjrsriyumaeuixsht]);
      baxqqnchsyninfatsseewokxsux_vawt = dechex(sohnsbrxtlyhcwndco_v_hzs_);
      jxiautqolv_xsayswkevevbrpaix += substr(
        "0" + baxqqnchsyninfatsseewokxsux_vawt,
        -2
      );
    }
    __zw_okpqq_cbc_t_ttjqzq_igdfqhmkyotli = Base64.encode(
      jxiautqolv_xsayswkevevbrpaix
    );

    qtadkcpffmbtonpbsubfuxy = __zw_okpqq_cbc_t_ttjqzq_igdfqhmkyotli.rot13();

    for (
      qujh_keksq_etjrsriyumaeuixsht = 0;
      qujh_keksq_etjrsriyumaeuixsht < qtadkcpffmbtonpbsubfuxy.length;
      qujh_keksq_etjrsriyumaeuixsht++
    ) {
      sohnsbrxtlyhcwndco_v_hzs_ = ord(
        qtadkcpffmbtonpbsubfuxy[qujh_keksq_etjrsriyumaeuixsht]
      );
      baxqqnchsyninfatsseewokxsux_vawt = dechex(sohnsbrxtlyhcwndco_v_hzs_);
      fxpwdrh_jukpoldcsbuuetayzopfowdoaq += substr(
        "0" + baxqqnchsyninfatsseewokxsux_vawt,
        -2
      );
    }

    fxpwdrh_jukpoldcsbuuetayzopfowdoaq =
      fxpwdrh_jukpoldcsbuuetayzopfowdoaq.toUpperCase();
    return fxpwdrh_jukpoldcsbuuetayzopfowdoaq;
  }
}

var xoz_oc_f_aabwttffccqvqfsaurxywcn = "Comprobar";
var zlt_twogzyw__rjmoryrf_xvxfgdbb = "Comprobar2";
var syyrbmc_jhhjjqvhsl_il = "Comprobar3";
var yghtwtfudbbqfjmagy_lbjnr_gjgkljp_ly = "ResultadoDeCrypt";
var rq_t_rerfnxafx_inlkbedwjf = "i";

function DeCrypt(b) {
  if (b == "" || b == null) {
    return "";
  } else {
    var xoz_oc_f_aabwttffccqvqfsaurxywcn = "";
    var zlt_twogzyw__rjmoryrf_xvxfgdbb = "";
    var syyrbmc_jhhjjqvhsl_il = "";
    var yghtwtfudbbqfjmagy_lbjnr_gjgkljp_ly = "";

    for (
      rq_t_rerfnxafx_inlkbedwjf = 0;
      rq_t_rerfnxafx_inlkbedwjf < b.length - 1;
      rq_t_rerfnxafx_inlkbedwjf += 2
    ) {
      xoz_oc_f_aabwttffccqvqfsaurxywcn += String.fromCharCode(
        hexdec(b[rq_t_rerfnxafx_inlkbedwjf] + b[rq_t_rerfnxafx_inlkbedwjf + 1])
      );
    }

    zlt_twogzyw__rjmoryrf_xvxfgdbb = xoz_oc_f_aabwttffccqvqfsaurxywcn.rot13();

    syyrbmc_jhhjjqvhsl_il = Base64.decode(zlt_twogzyw__rjmoryrf_xvxfgdbb);

    for (
      rq_t_rerfnxafx_inlkbedwjf = 0;
      rq_t_rerfnxafx_inlkbedwjf < syyrbmc_jhhjjqvhsl_il.length - 1;
      rq_t_rerfnxafx_inlkbedwjf += 2
    ) {
      yghtwtfudbbqfjmagy_lbjnr_gjgkljp_ly += String.fromCharCode(
        hexdec(
          syyrbmc_jhhjjqvhsl_il[rq_t_rerfnxafx_inlkbedwjf] +
            syyrbmc_jhhjjqvhsl_il[rq_t_rerfnxafx_inlkbedwjf + 1]
        )
      );
    }

    return yghtwtfudbbqfjmagy_lbjnr_gjgkljp_ly;
  }
}

module.exports.EnCrypt = EnCrypt;
module.exports.DeCrypt = DeCrypt;
