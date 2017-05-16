// Type definitions for telnet-stream
// Project: https://github.com/blinkdog/telnet-stream
/// <reference types="node" />

declare module 'telnet-stream' {
  import { Transform } from 'stream';


  /**
   * https://www.npmjs.com/package/telnet-stream#telnetoutput
   * TelnetOutput is a Transform stream for the output side of TELNET.
   * Data written to TelnetOutput is properly escaped to ensure that it isn't interpreted as a TELNET command.
   * It also has methods for sending TELNET option negotiations and subnegotiations.
   * TELNET commands start with the Interpret as Command (IAC) octet.
   * In order to send a literal IAC octet (one that is intended as data, not as a TELNET command),
   * it must be sent as IAC IAC. TelnetOutput takes care of this transformation automatically.
   */
  export class TelnetOutput extends Transform {
    /**
     * https://www.npmjs.com/package/telnet-stream#writecommandcommand
     * Call this method to send a TELNET command to the remote system.
     * @param command The command octet to send
     */
    writeCommand(command: string): boolean

    /**
     * https://www.npmjs.com/package/telnet-stream#writedooption
     * Call this method to send a TELNET DO option negotiation to the remote system.
     * A DO request is sent when the local system wants the remote system to perform some function or obey some protocol.
     * @param optionOctet The option octet to request of the remote system
     */
    writeDo(optionOctet: number): boolean

    /**
     * https://www.npmjs.com/package/telnet-stream#writedontoption
     * Call this method to send a TELNET DONT option negotiation to the remote system.
     * A DONT request is sent when the local system wants the remote system to NOT perform some function or NOT obey some protocol.
     * @param optionOctet The option octet to request of the remote system
     */
    writeDont(optionOctet: number): boolean

    /**
     * https://www.npmjs.com/package/telnet-stream#writesuboption-buffer
     * Call this method to send a TELNET subnegotiation to the remote system.
     * After the local and remote system have negotiated an option, then subnegotiation information can be sent.
     * @param optionOctet The option octet; identifies what the subnegotiation is about
     * @param buffer The buffer containing the subnegotiation data to send
     */
    writeSub(optionOctet: number, buffer: Buffer): boolean

    /**
     * https://www.npmjs.com/package/telnet-stream#writewilloption
     * Call this method to send a TELNET WILL option negotiation to the remote system.
     * A WILL offer is sent when the local system wants to inform the remote system that it will perform some function or obey some protocol.
     * @param optionOctet The option octet to offer to the remote system
     */
    writeWill(optionOctet: number): boolean

    /**
     * https://www.npmjs.com/package/telnet-stream#writewontoption
     * Call this method to send a TELNET WONT option negotiation to the remote system.
     * A WONT refusal is sent when the remote system has requested that the local system perform some function or obey some protocol,
     * and the local system is refusing to do so.
     * @param optionOctet The option octet to refuse to the remote system
     */
    writeWont(optionOctet: number): boolean
  }

  export class TelnetInput extends Transform {
  }
}
