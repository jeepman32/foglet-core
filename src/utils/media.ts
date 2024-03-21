import CommunicationProtocol from "../network/communication/abstract/communication-protocol";
import Communication from "../network/communication/communication";
import { v4 } from "uuid";
import merge from "lodash.merge";
import Stream from "stream";
// @ts-expect-error There are no types for the following package.
import MediaSourceUntyped from "mediasource";
// @ts-expect-error There are no types for the following package.
import MediaRecorderUntyped from "media-recorder-stream";
import AbstractNetwork from "../network/abstract/abstract-network";

const MediaSource = MediaSourceUntyped as MediaSource;
const MediaRecorder = MediaRecorderUntyped as MediaRecorder;

class ReadableFromStream extends Stream.Readable {
  private source: MediaSource;
  private parent: Communication;
  private count: number;

  constructor(
    source: MediaSource,
    parent: Communication,
    options: Stream.ReadableOptions | undefined,
  ) {
    super(options);
    this.source = source;
    this.parent = parent;
    this.count = 0;

    let stack = "";

    this.source.on(
      "data",
      (data: { id: any; type: string; payload: string }) => {
        if (this.count === 0) {
          if (!this.parent._activeStream.has(data.id)) {
            debug("Setting options for %s", data.id, data);
            this.parent._activeStream.set(data.id, {
              source: this,
              options: data,
            });
          }
          this.parent.emit("receive", data.id);
          this.count++;
        } else {
          if (data.type === "full") {
            this.push(data.payload);
            this.count++;
          } else if (data.type === "end") {
            stack += data.payload;
            this.push(new Uint8Array(JSON.parse(stack).data));
            this.count++;
            stack = "";
          } else {
            stack += data.payload;
          }
        }
      },
    );
    this.source.on("end", () => {
      this.end();
    });
  }
  end() {
    throw new Error("Method not implemented.");
  }
}

/**
 * Media Stream Manager
 * If using Video/audio stream for all users: use the broadcast primitive (Data Channel)
 * If using Video/audio stream for only one user, use the unicast primitive (Streaming)
 * But pay attention that using unicast method, when a shuffling occur the connection might diseapear.
 * For this usage, create an overlay network with only this peer connected to you.
 * Or shut down the shuffle mechanism but this is not recommended.
 * @extends CommunicationProtocol
 */
class Media extends CommunicationProtocol {
  private activeMedia: Map<string, MediaSource>;
  private activeStream: Map<string, MediaStream>;
  private communication: Communication;
  private source: any;
  private options: { chunkSize: number };

  constructor(source: AbstractNetwork, protocol: any) {
    super(source, `foglet-media-internal-${protocol}`);
    this.options = {
      chunkSize: 16 * 1000, // pay attention to the maximum, or it will not work. see (http://viblast.com/blog/2015/2/5/webrtc-data-channel-message-size/)
    };
    this.activeMedia = new Map();
    this.activeStream = new Map();
    this.communication = new Communication(
      source,
      `foglet-media-internal-${protocol}`,
    );

    this.source.rps.on("stream", (id: any, stream: any) => {
      this.receive(id, stream);
    });

    this.communication.onStreamBroadcast((id: any, stream: any) => {
      console.debug("Receive a media stream: ", id, stream);
      this.reconstruct(stream);
    });
  }

  get pid() {
    return this.source.rps._pid();
  }

  /**
   * Send a message to only one neighbor...
   * @param {Object} id - The id to send the stream (media) to
   * @param  {Object}  media  - The stream to send
   * @return {boolean}
   */
  sendUnicast(id: any, media: { id: string }) {
    if (!media.id) media.id = v4();
    if (!this.activeMedia.has(media.id)) {
      this.activeMedia.set(media.id, media);
      this.setListeners(media);
    }
    return this.source.rps.stream(id, media);
  }

  /**
   * Send a MediaStream using our broadcast primitives using Data Channel.
   * @param {Object}  media  - The stream to send
   * @param {Object} options - MediaRecorder options (see MediaRecorder API)
   * @return {boolean}
   */
  sendBroadcastOverDataChannel(media: { id: string }, options = {}) {
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/MediaRecorder
    options = merge(
      {
        mimeType: 'video/webm; codecs="vp8"', // You MUST set the MIME type
        interval: 100, // A short interval is recommended to keep buffer sizes low
        bitsPerSecond: 128 * 1024,
      },
      options,
    );

    if (!media.id) media.id = v4();
    if (!this.activeMedia.has(media.id)) {
      this.activeMedia.set(media.id, media);
      this.setListeners(media);
    }
    console.log(media, options);
    let ms;
    try {
      ms = new MediaRecorder(media, options);
    } catch (e) {
      throw new Error("Error when recording the media: ", e);
    }
    const stream = this.communication.streamBroadcast();
    options.id = media.id;
    stream.write(options);
    ms.on("data", (data: any) => {
      const chunkified = this.chunkify(JSON.stringify(data));
      if (chunkified.length === 0) {
        stream.write({
          type: "full",
          id: 0,
          payload: chunkified[0],
        });
      } else {
        for (let i = 0; i < chunkified.length; i++) {
          if (i === chunkified.length - 1) {
            stream.write({
              type: "end",
              id: i,
              payload: chunkified[i],
            });
          } else {
            stream.write({
              type: "chunk",
              id: i,
              payload: chunkified[i],
            });
          }
        }
      }
    });
    ms.on("end", () => {
      stream.end();
    });
  }

  private reconstruct(stream: any, options = null) {
    const readable = new ReadableFromStream(stream, this);
    readable.on("error", (err) => {
      console.error(err);
    });
  }

  getStreamMedia(
    id: any,
    elem: {
      addEventListener: (arg0: string, arg1: () => void) => void;
      error: any;
    },
  ) {
    if (!this.activeStream.has(id)) return undefined;
    const wrapper = new MediaSource(elem);
    const writable = wrapper.createWriteStream(
      this.activeStream.get(id).options.mimeType,
    );
    elem.addEventListener("error", function () {
      // listen for errors on the video/audio element directly
      const errorCode = elem.error;
      const detailedError = wrapper.detailedError;
      console.error(errorCode, detailedError);
      // wrapper.detailedError will often have a more detailed error message
    });

    writable.on("error", function (err: any) {
      // listening to the stream 'error' event is optional
      console.error(err);
    });
    this.activeStream.get(id).source.pipe(writable);
  }

  /**
   * Handler executed when a message is recevied
   * @param  {string} id  - Message issuer's ID
   * @param  {Object} stream - The stream received
   * @return {void}
   */
  private receive(id: any, stream: { id: string }) {
    debug("Receive a media stream: ", id, stream);
    if (!stream.id) stream.id = v4();
    if (!this.activeMedia.has(stream.id)) {
      this.activeMedia.set(stream.id, { peer: id, stream });
      this.setListeners(stream);
    }
    this.emit("receive", id, stream);
  }

  private setListeners(media: {
    onactive: () => void;
    id: any;
    oninactive: () => void;
    onended: () => void;
  }) {
    media.onactive = () => {
      console.log("Media %s is active...", media.id);
    };
    media.oninactive = () => {
      console.log(
        "Media %s is inactive... (Disconnection or a Shuffling occured.)",
        media.id,
      );
      // this._sendRequest(media.id)
    };
    media.onended = () => {
      console.log("Media %s is finished...", media.id);
    };
  }

  /**
   * Chunk a string into n message of size 'chunkSize'
   * @param {string} string
   * @param {Number=this.options.chunkSize} chunkSize
   */
  chunkify(string: string, chunkSize = this.options.chunkSize) {
    // https://stackoverflow.com/questions/7033639/split-large-string-in-n-size-chunks-in-javascript
    return string.match(new RegExp(".{1," + chunkSize + "}", "g"));
  }
}

export default Media;
