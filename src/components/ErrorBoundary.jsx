import { Component } from "react";
import { aBtn } from "../lib/styles.js";

export default class EB extends Component{
  constructor(p){super(p);this.state={e:null}}
  static getDerivedStateFromError(e){return{e}}
  render(){
    if(this.state.e)return<div style={{padding:'2rem',textAlign:'center'}}><h2>Napaka</h2><p>{this.state.e?.message}</p><button onClick={()=>{this.setState({e:null});window.location.reload()}} style={aBtn}>Ponovno naloži</button></div>;
    return this.props.children;
  }
}
