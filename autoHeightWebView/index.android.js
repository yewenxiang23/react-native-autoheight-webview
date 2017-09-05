// "use strict";

// import React, { PureComponent } from "react";

// import {
//   findNodeHandle,
//   requireNativeComponent,
//   Animated,
//   DeviceEventEmitter,
//   Dimensions,
//   StyleSheet,
//   Platform,
//   UIManager,
//   View,
//   ViewPropTypes,
//   WebView,
//   Linking
// } from "react-native";

// import PropTypes from "prop-types";

// import Immutable from "immutable";

// const RCTAutoHeightWebView = requireNativeComponent(
//   "RCTAutoHeightWebView",
//   AutoHeightWebView,
//   { nativeOnly: { messagingEnabled: PropTypes.bool } }
// );

// export default class AutoHeightWebView extends PureComponent {
//   static propTypes = {
//     source: WebView.propTypes.source,
//     onHeightUpdated: PropTypes.func,
//     customScript: PropTypes.string,
//     enableAnimation: PropTypes.bool,
//     // if set to false may cause some layout issues (width of container will be than width of screen)
//     scalesPageToFit: PropTypes.bool,
//     // only works on enable animation
//     animationDuration: PropTypes.number,
//     // offset of rn webview margin
//     heightOffset: PropTypes.number,
//     // baseUrl not work in android 4.3 or below version
//     enableBaseUrl: PropTypes.bool,
//     style: ViewPropTypes.style,
//     // works if set enableBaseUrl to true; add web/files... to android/app/src/assets/
//     files: PropTypes.arrayOf(
//       PropTypes.shape({
//         href: PropTypes.string,
//         type: PropTypes.string,
//         rel: PropTypes.string
//       })
//     )
//   };

//   static defaultProps = {
//     scalesPageToFit: true,
//     enableBaseUrl: false,
//     enableAnimation: true,
//     animationDuration: 555,
//     heightOffset: 20
//   };

//   constructor(props) {
//     super(props);
//     this.onMessage = this.onMessage.bind(this);
//     if (this.props.enableAnimation) {
//       this.opacityAnimatedValue = new Animated.Value(0);
//     }
//     if (IsBelowKitKat) {
//       this.listenWebViewBridgeMessage = this.listenWebViewBridgeMessage.bind(
//         this
//       );
//     }
//     const initialScript = props.files
//       ? this.appendFilesToHead(props.files, BaseScript)
//       : BaseScript;
//     this.state = {
//       isChangingSource: false,
//       height: 0,
//       heightOffset: 0,
//       script: initialScript
//     };
//   }

//   componentWillMount() {
//     if (IsBelowKitKat) {
//       DeviceEventEmitter.addListener(
//         "webViewBridgeMessage",
//         this.listenWebViewBridgeMessage
//       );
//     }
//   }

//   componentDidMount() {
//     this.startInterval();
//   }

//   componentWillReceiveProps(nextProps) {
//     // injectedJavaScript only works when webview reload (source changed)
//     if (
//       Immutable.is(
//         Immutable.fromJS(this.props.source),
//         Immutable.fromJS(nextProps.source)
//       )
//     ) {
//       return;
//     } else {
//       this.setState(
//         {
//           isChangingSource: true,
//           height: 0,
//           heightOffset: 0
//         },
//         () => {
//           this.startInterval();
//           this.setState({ isChangingSource: false });
//         }
//       );
//     }
//     let currentScript = BaseScript;
//     if (nextProps.files) {
//       currentScript = this.appendFilesToHead(nextProps.files, BaseScript);
//     }
//     this.setState({ script: currentScript });
//   }

//   componentWillUnmount() {
//     this.stopInterval();
//     if (IsBelowKitKat) {
//       DeviceEventEmitter.removeListener(
//         "webViewBridgeMessage",
//         this.listenWebViewBridgeMessage
//       );
//     }
//   }

//   // below kitkat
//   listenWebViewBridgeMessage(body) {
//     this.onMessage(body.message);
//   }

//   // below kitkat
//   sendToWebView(message) {
//     UIManager.dispatchViewManagerCommand(
//       findNodeHandle(this.webview),
//       UIManager.RCTAutoHeightWebView.Commands.sendToWebView,
//       [String(message)]
//     );
//   }

//   postMessage(data) {
//     UIManager.dispatchViewManagerCommand(
//       findNodeHandle(this.webview),
//       UIManager.RCTAutoHeightWebView.Commands.postMessage,
//       [String(data)]
//     );
//   }

//   startInterval() {
//     this.finishInterval = false;
//     this.interval = setInterval(() => {
//       if (!this.finishInterval) {
//         IsBelowKitKat
//           ? this.sendToWebView("getBodyHeight")
//           : this.postMessage("getBodyHeight");
//       }
//     }, 205);
//   }

//   stopInterval() {
//     this.finishInterval = true;
//     clearInterval(this.interval);
//   }

//   onHeightUpdated(height) {
//     if (this.props.onHeightUpdated) {
//       this.props.onHeightUpdated(height);
//     }
//   }

//   onMessage(e) {
//     const height = parseInt(
//       IsBelowKitKat ? e.nativeEvent.message : e.nativeEvent.data
//     );
//     if (height) {
//       if (this.props.enableAnimation) {
//         this.opacityAnimatedValue.setValue(0);
//       }
//       this.stopInterval();
//       this.setState(
//         {
//           heightOffset: this.props.heightOffset,
//           height
//         },
//         () => {
//           if (this.props.enableAnimation) {
//             Animated.timing(this.opacityAnimatedValue, {
//               toValue: 1,
//               duration: this.props.animationDuration
//             }).start(() => this.onHeightUpdated(height));
//           } else {
//             this.onHeightUpdated(height);
//           }
//         }
//       );
//     }
//   }

//   appendFilesToHead(files, script) {
//     if (!files) {
//       return script;
//     }
//     for (let file of files) {
//       script =
//         `
//                 var link  = document.createElement('link');
//                 link.rel  = '` +
//         file.rel +
//         `';
//                 link.type = '` +
//         file.type +
//         `';
//                 link.href = '` +
//         file.href +
//         `';
//                 document.head.appendChild(link);
//                 ` +
//         script;
//     }
//     return script;
//   }

//   render() {
//     const { height, script, isChangingSource, heightOffset } = this.state;
//     const {
//       scalesPageToFit,
//       enableAnimation,
//       source,
//       customScript,
//       style,
//       enableBaseUrl
//     } = this.props;
//     let webViewSource = source;
//     if (enableBaseUrl) {
//       webViewSource = Object.assign({}, source, {
//         baseUrl: "file:///android_asset/web/"
//       });
//     }
//     return (
//       <Animated.View
//         style={[
//           Styles.container,
//           {
//             opacity: enableAnimation ? this.opacityAnimatedValue : 1,
//             height: height + heightOffset
//           },
//           style
//         ]}
//       >
//         {isChangingSource ? null : (
//           <RCTAutoHeightWebView
//             ref={webview => (this.webview = webview)}
//             style={Styles.webView}
//             javaScriptEnabled={true}
//             injectedJavaScript={script + customScript}
//             scalesPageToFit={scalesPageToFit}
//             source={webViewSource}
//             onMessage={this.onMessage}
//             messagingEnabled={true}
//             // below kitkat
//             onChange={this.onMessage}
//             onNavigationStateChange={(event)=>{
//               console.log(event)
//               if (event.url !== uri) {
//                 this.webview.stopLoading();
//                 Linking.openURL(event.url);
//               }
//             }} //用户在页面中点击触发
//           />
//         )}
//       </Animated.View>
//     );
//   }
// }

// const ScreenWidth = Dimensions.get("window").width;

// const IsBelowKitKat = Platform.Version < 19;

// const Styles = StyleSheet.create({
//   container: {
//     width: ScreenWidth,
//     backgroundColor: "transparent"
//   },
//   webView: {
//     flex: 1,
//     backgroundColor: "transparent"
//   }
// });

// const BaseScript = IsBelowKitKat
//   ? `
//     ; (function () {
//         AutoHeightWebView.onMessage = function (message) {
//             AutoHeightWebView.send(String(document.body.offsetHeight));
//         };
//     } ()); 
//     `
//   : `
//     ; (function () {
//         document.addEventListener('message', function (e) {
//             window.postMessage(String(document.body.offsetHeight));
//         });
//     } ()); 
//     `;

'use strict'

import React, { PureComponent } from 'react';

import {
    Animated,
    Dimensions,
    StyleSheet,
    View,
    ViewPropTypes,
    WebView,
    Linking
} from 'react-native';

import PropTypes from 'prop-types';

export default class AutoHeightWebView extends PureComponent {
    static propTypes = {
        source: WebView.propTypes.source,
        onHeightUpdated: PropTypes.func,
        customScript: PropTypes.string,
        enableAnimation: PropTypes.bool,
        // if set to true may cause some layout issues (smaller font size)
        scalesPageToFit: PropTypes.bool,
        // only works on enable animation
        animationDuration: PropTypes.number,
        // offset of rn webview margin
        heightOffset: PropTypes.number,
        style: ViewPropTypes.style,
        // add web/files... to project root
        files: PropTypes.arrayOf(PropTypes.shape({
            href: PropTypes.string,
            type: PropTypes.string,
            rel: PropTypes.string
        }))
    }

    static defaultProps = {
        scalesPageToFit: false,
        enableAnimation: true,
        animationDuration: 555,
        heightOffset: 12
    }

    constructor(props) {
        super(props);
        this.handleNavigationStateChange = this.handleNavigationStateChange.bind(this);
        if (this.props.enableAnimation) {
            this.opacityAnimatedValue = new Animated.Value(0);
        }
        const initialScript = props.files ? this.appendFilesToHead(props.files, BaseScript) : BaseScript;
        this.state = {
            height: 0,
            script: initialScript
        };
    }

    componentWillReceiveProps(nextProps) {
        let currentScript = BaseScript;
        if (nextProps.files) {
            currentScript = this.appendFilesToHead(nextProps.files, BaseScript);
        }
        this.setState({ script: currentScript });
    }

    appendFilesToHead(files, script) {
        if (!files) {
            return script;
        }
        for (let file of files) {
            script =
                `
                var link  = document.createElement('link');
                link.rel  = '` + file.rel + `';
                link.type = '` + file.type + `';
                link.href = '` + file.href + `';
                document.head.appendChild(link);
                `+ script;
        }
        return script;
    }

    onHeightUpdated(height) {
        if (this.props.onHeightUpdated) {
            this.props.onHeightUpdated(height);
        }
    }
    _handleUrl = (url) => {
        let webUrl = url
        const index = webUrl.lastIndexOf('#')
        if(index>0){
            webUrl = webUrl.substring(0,index)
        }
        return webUrl
    }
    handleNavigationStateChange(navState) {
        const height = Number(navState.title);
        if (height) {
            if (this.props.enableAnimation) {
                this.opacityAnimatedValue.setValue(0);
            }
            this.setState({ height }, () => {
                if (this.props.enableAnimation) {
                    Animated.timing(this.opacityAnimatedValue, {
                        toValue: 1,
                        duration: this.props.animationDuration
                    }).start(() => this.onHeightUpdated(height));
                }
                else {
                    this.onHeightUpdated(height);
                }
            });
        }
        if (this._handleUrl(navState.url) !== this.props.source.uri) {
            this.webview.stopLoading();
            Linking.openURL(navState.url);
        }
    }

    render() {
        const { height, script } = this.state;
        const { scalesPageToFit, enableAnimation, source, heightOffset, customScript, style } = this.props;
        const webViewSource = Object.assign({}, source, { baseUrl: 'web/' });
        return (
            <Animated.View style={[Styles.container, {
                opacity: enableAnimation ? this.opacityAnimatedValue : 1,
                height: height + heightOffset,
            }, style]}>
                <WebView
                    ref={(ref)=>this.webview = ref}
                    style={Styles.webView}
                    injectedJavaScript={script + customScript}
                    scrollEnabled={false}
                    scalesPageToFit={scalesPageToFit}
                    source={webViewSource}
                    onNavigationStateChange={this.handleNavigationStateChange}
                     />
            </Animated.View>
        );
    }
}

const ScreenWidth = Dimensions.get('window').width;

const Styles = StyleSheet.create({
    container: {
        width: ScreenWidth,
        backgroundColor: 'transparent'
    },
    webView: {
        flex: 1,
        backgroundColor: 'transparent'
    }
});

// note that it can not get height when there are only text objects in a html body which does not make any sense 
const BaseScript =
    `
    ; (function () {
        var i = 0;
        function updateHeight() {
            document.title = document.body.offsetHeight;
            window.location.hash = ++i;
        }
        updateHeight();
        window.addEventListener('load', updateHeight);
        window.addEventListener('resize', updateHeight);
    } ());
    `;
