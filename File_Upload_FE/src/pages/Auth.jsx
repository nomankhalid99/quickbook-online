import React from 'react'

const Auth = () => {
    const handleClick = async()=>{
        window.location.href = 'http://localhost:3000/authorize';
    }
  return (
    <div>
        <button onClick={handleClick} >Check Authorization</button>
    </div>
  )
}

export default Auth